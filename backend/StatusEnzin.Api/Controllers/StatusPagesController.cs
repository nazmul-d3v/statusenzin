using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StatusEnzin.Api.Data;
using StatusEnzin.Api.DTOs;
using StatusEnzin.Api.Models;

namespace StatusEnzin.Api.Controllers;

[ApiController]
[Route("api/status-pages")]
public class StatusPagesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenantProvider;

    public StatusPagesController(AppDbContext db, ITenantProvider tenantProvider)
    {
        _db = db;
        _tenantProvider = tenantProvider;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetStatusPages()
    {
        var pages = await _db.StatusPages
            .Include(sp => sp.Incidents)
            .Include(sp => sp.Subscribers)
            .OrderByDescending(sp => sp.CreatedAt)
            .ToListAsync();

        return Ok(pages);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateStatusPage([FromBody] CreateStatusPageRequest req)
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();
        if (tenantId == null) return Unauthorized();

        var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == tenantId.Value);
        var currentCount = await _db.StatusPages.CountAsync();

        int maxPages = tenant?.PlanType switch
        {
            "Business" => 10,
            "Pro" => 3,
            _ => 1
        };

        if (currentCount >= maxPages)
        {
            return BadRequest(new { message = $"Plan limit reached. Your plan allows up to {maxPages} status page(s)." });
        }

        var slug = req.Slug.ToLower().Trim().Replace(" ", "-");
        var existing = await _db.StatusPages.IgnoreQueryFilters().FirstOrDefaultAsync(sp => sp.Slug == slug);
        if (existing != null)
        {
            return BadRequest(new { message = "Status page URL slug is already taken. Please choose another." });
        }

        var page = new StatusPage
        {
            TenantId = tenantId.Value,
            Name = req.Name,
            Slug = slug,
            Description = req.Description,
            IsPublic = req.IsPublic,
            ComponentIdsJson = JsonSerializer.Serialize(req.ComponentIds ?? new List<Guid>())
        };

        _db.StatusPages.Add(page);
        await _db.SaveChangesAsync();

        return Ok(page);
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateStatusPage(Guid id, [FromBody] UpdateStatusPageRequest req)
    {
        var page = await _db.StatusPages.FirstOrDefaultAsync(sp => sp.Id == id);
        if (page == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.Slug))
        {
            var slug = req.Slug.ToLower().Trim().Replace(" ", "-");
            var existing = await _db.StatusPages.IgnoreQueryFilters().FirstOrDefaultAsync(sp => sp.Slug == slug && sp.Id != id);
            if (existing != null)
            {
                return BadRequest(new { message = "Status page URL slug is already taken. Please choose another." });
            }
            page.Slug = slug;
        }

        page.Name = req.Name;
        page.Description = req.Description;
        page.IsPublic = req.IsPublic;
        page.ComponentIdsJson = JsonSerializer.Serialize(req.ComponentIds ?? new List<Guid>());

        await _db.SaveChangesAsync();
        return Ok(page);
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteStatusPage(Guid id)
    {
        var page = await _db.StatusPages.FirstOrDefaultAsync(sp => sp.Id == id);
        if (page == null) return NotFound();

        _db.StatusPages.Remove(page);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Status page deleted." });
    }

    // PUBLIC ENDPOINT FOR UNAUTHENTICATED VISITORS
    [AllowAnonymous]
    [HttpGet("public/{slug}")]
    public async Task<IActionResult> GetPublicStatusPage(string slug)
    {
        var page = await _db.StatusPages
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(sp => sp.Slug == slug.ToLower());

        if (page == null || !page.IsPublic)
        {
            return NotFound(new { message = "Status page not found." });
        }

        var incidents = await _db.Incidents
            .IgnoreQueryFilters()
            .Where(i => i.StatusPageId == page.Id)
            .Include(i => i.Updates)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        // Decode attached component monitor IDs
        var monitorIds = JsonSerializer.Deserialize<List<Guid>>(page.ComponentIdsJson) ?? new List<Guid>();

        var ninetyDaysAgo = DateTime.UtcNow.AddDays(-90);

        var monitors = await _db.Monitors
            .IgnoreQueryFilters()
            .Where(m => monitorIds.Contains(m.Id))
            .Include(m => m.Checks.Where(c => c.CheckedAt >= ninetyDaysAgo).OrderBy(c => c.CheckedAt).Take(1000))
            .ToListAsync();

        var tenant = await _db.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == page.TenantId);

        if (tenant != null && tenant.IsSuspended)
        {
            return StatusCode(403, new { message = "This status page is currently suspended by platform administration." });
        }

        // Overall status computation
        string globalStatus = "Operational";
        if (monitors.Any(m => m.Status == "Down"))
        {
            globalStatus = "Major Outage";
        }
        else if (monitors.Any(m => m.Status == "Degraded"))
        {
            globalStatus = "Degraded Performance";
        }

        return Ok(new
        {
            page.Id,
            page.Name,
            page.Slug,
            page.Description,
            TenantName = tenant?.Name ?? "Organization",
            GlobalStatus = globalStatus,
            Monitors = monitors.Select(m => new
            {
                m.Id,
                m.Name,
                m.Status,
                m.UptimePercentage,
                m.LastLatencyMs,
                m.LastCheckedAt,
                ChecksHistory = m.Checks.Select(c => new
                {
                    c.IsSuccess,
                    c.ResponseTimeMs,
                    c.CheckedAt
                })
            }),
            Incidents = incidents.Select(i => {
                var updates = (i.Updates != null && i.Updates.Any())
                    ? i.Updates.OrderByDescending(u => u.CreatedAt).Select(u => new
                    {
                        u.Id,
                        u.Status,
                        u.Message,
                        u.CreatedAt
                    }).ToList()
                    : new[]
                    {
                        new
                        {
                            Id = i.Id,
                            Status = i.Status,
                            Message = i.Message,
                            CreatedAt = i.CreatedAt
                        }
                    }.ToList();

                return new
                {
                    i.Id,
                    i.Title,
                    i.Status,
                    i.Impact,
                    i.Message,
                    i.CreatedAt,
                    i.UpdatedAt,
                    Updates = updates
                };
            })
        });
    }
}
