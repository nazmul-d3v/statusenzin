using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StatusEnzin.Api.Data;
using StatusEnzin.Api.DTOs;
using StatusEnzin.Api.Models;
using Monitor = StatusEnzin.Api.Models.Monitor;

namespace StatusEnzin.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/monitors")]
public class MonitorsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenantProvider;

    public MonitorsController(AppDbContext db, ITenantProvider tenantProvider)
    {
        _db = db;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<IActionResult> GetMonitors()
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();
        if (tenantId == null) return Unauthorized();

        var ninetyDaysAgo = DateTime.UtcNow.AddDays(-90);

        var monitors = await _db.Monitors
            .Include(m => m.Checks.Where(c => c.CheckedAt >= ninetyDaysAgo).OrderBy(c => c.CheckedAt).Take(1000))
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new
            {
                m.Id,
                m.Name,
                m.Url,
                m.CheckIntervalSeconds,
                m.ExpectedStatusCode,
                m.Status,
                m.LastLatencyMs,
                m.UptimePercentage,
                m.LastCheckedAt,
                m.NextCheckAt,
                RecentChecks = m.Checks.Select(c => new
                {
                    c.Id,
                    c.StatusCode,
                    c.ResponseTimeMs,
                    c.IsSuccess,
                    c.CheckedAt
                })
            })
            .ToListAsync();

        return Ok(monitors);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetMonitor(Guid id)
    {
        var ninetyDaysAgo = DateTime.UtcNow.AddDays(-90);

        var monitor = await _db.Monitors
            .Include(m => m.Checks.Where(c => c.CheckedAt >= ninetyDaysAgo).OrderBy(c => c.CheckedAt).Take(1000))
            .FirstOrDefaultAsync(m => m.Id == id);

        if (monitor == null) return NotFound(new { message = "Monitor not found." });

        return Ok(new
        {
            monitor.Id,
            monitor.Name,
            monitor.Url,
            monitor.CheckIntervalSeconds,
            monitor.ExpectedStatusCode,
            monitor.Status,
            monitor.LastLatencyMs,
            monitor.UptimePercentage,
            monitor.LastCheckedAt,
            monitor.NextCheckAt,
            Checks = monitor.Checks.Select(c => new
            {
                c.Id,
                c.StatusCode,
                c.ResponseTimeMs,
                c.IsSuccess,
                c.ErrorMessage,
                c.CheckedAt
            })
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateMonitor([FromBody] CreateMonitorRequest req)
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();
        if (tenantId == null) return Unauthorized();

        var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == tenantId.Value);
        var currentCount = await _db.Monitors.CountAsync();

        int maxMonitors = tenant?.PlanType switch
        {
            "Business" => 100,
            "Pro" => 25,
            _ => 5
        };

        if (currentCount >= maxMonitors)
        {
            return BadRequest(new { message = $"Plan limit reached. Your current plan ({tenant?.PlanType ?? "Starter"}) allows up to {maxMonitors} monitors." });
        }

        var monitor = new Monitor
        {
            TenantId = tenantId.Value,
            Name = req.Name,
            Url = req.Url,
            CheckIntervalSeconds = req.CheckIntervalSeconds > 0 ? req.CheckIntervalSeconds : 300,
            ExpectedStatusCode = req.ExpectedStatusCode > 0 ? req.ExpectedStatusCode : 200,
            Status = "Operational",
            NextCheckAt = DateTime.UtcNow
        };

        _db.Monitors.Add(monitor);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMonitor), new { id = monitor.Id }, monitor);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateMonitor(Guid id, [FromBody] UpdateMonitorRequest req)
    {
        var monitor = await _db.Monitors.FirstOrDefaultAsync(m => m.Id == id);
        if (monitor == null) return NotFound();

        monitor.Name = req.Name;
        monitor.Url = req.Url;
        monitor.CheckIntervalSeconds = req.CheckIntervalSeconds;
        monitor.ExpectedStatusCode = req.ExpectedStatusCode;

        await _db.SaveChangesAsync();
        return Ok(monitor);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteMonitor(Guid id)
    {
        var monitor = await _db.Monitors.FirstOrDefaultAsync(m => m.Id == id);
        if (monitor == null) return NotFound();

        _db.Monitors.Remove(monitor);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Monitor deleted." });
    }

    [HttpPost("{id:guid}/check-now")]
    public async Task<IActionResult> CheckNow(Guid id)
    {
        var monitor = await _db.Monitors.FirstOrDefaultAsync(m => m.Id == id);
        if (monitor == null) return NotFound();

        using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
        var sw = Stopwatch.StartNew();
        int statusCode = 0;
        bool isSuccess = false;
        string? errorMsg = null;

        try
        {
            var res = await client.GetAsync(monitor.Url);
            sw.Stop();
            statusCode = (int)res.StatusCode;
            isSuccess = statusCode == monitor.ExpectedStatusCode || (statusCode >= 200 && statusCode < 400);
        }
        catch (Exception ex)
        {
            sw.Stop();
            errorMsg = ex.Message;
        }

        int latency = (int)sw.ElapsedMilliseconds;
        var check = new MonitorCheck
        {
            MonitorId = monitor.Id,
            TenantId = monitor.TenantId,
            StatusCode = statusCode,
            ResponseTimeMs = latency,
            IsSuccess = isSuccess,
            ErrorMessage = errorMsg,
            CheckedAt = DateTime.UtcNow
        };

        _db.MonitorChecks.Add(check);
        monitor.LastCheckedAt = DateTime.UtcNow;
        monitor.LastLatencyMs = latency;
        monitor.Status = isSuccess ? "Operational" : "Down";
        monitor.NextCheckAt = DateTime.UtcNow.AddSeconds(monitor.CheckIntervalSeconds);

        await _db.SaveChangesAsync();

        return Ok(new { isSuccess, statusCode, latencyMs = latency, errorMessage = errorMsg });
    }
}
