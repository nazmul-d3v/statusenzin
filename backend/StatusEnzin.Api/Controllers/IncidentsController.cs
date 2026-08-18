using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StatusEnzin.Api.Data;
using StatusEnzin.Api.DTOs;
using StatusEnzin.Api.Models;
using StatusEnzin.Api.Services;

namespace StatusEnzin.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/incidents")]
public class IncidentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenantProvider;
    private readonly IConfiguration _configuration;

    public IncidentsController(AppDbContext db, ITenantProvider tenantProvider, IConfiguration configuration)
    {
        _db = db;
        _tenantProvider = tenantProvider;
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<IActionResult> GetIncidents([FromQuery] Guid? statusPageId)
    {
        var query = _db.Incidents.Include(i => i.Updates).AsQueryable();
        if (statusPageId.HasValue)
        {
            query = query.Where(i => i.StatusPageId == statusPageId.Value);
        }

        var incidents = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();
        return Ok(incidents);
    }

    [HttpPost]
    public async Task<IActionResult> CreateIncident([FromBody] CreateIncidentRequest req)
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();
        if (tenantId == null) return Unauthorized();

        var incident = new Incident
        {
            TenantId = tenantId.Value,
            StatusPageId = req.StatusPageId,
            Title = req.Title,
            Status = string.IsNullOrWhiteSpace(req.Status) ? "Investigating" : req.Status,
            Impact = string.IsNullOrWhiteSpace(req.Impact) ? "Minor" : req.Impact,
            Message = req.Message,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var initialUpdate = new IncidentUpdate
        {
            TenantId = tenantId.Value,
            IncidentId = incident.Id,
            Status = incident.Status,
            Message = incident.Message,
            CreatedAt = incident.CreatedAt
        };
        incident.Updates.Add(initialUpdate);

        _db.Incidents.Add(incident);
        await _db.SaveChangesAsync();

        var subscribers = await _db.Subscribers
            .Where(s => s.StatusPageId == req.StatusPageId && s.IsConfirmed)
            .ToListAsync();

        var page = await _db.StatusPages.FirstOrDefaultAsync(sp => sp.Id == req.StatusPageId);
        if (page != null)
        {
            var frontendUrl = (_configuration["FRONTEND_URL"] ?? "http://localhost:3000").TrimEnd('/');

            foreach (var sub in subscribers)
            {
                _db.EmailJobs.Add(BuildIncidentJob(sub, page, incident.Title, incident.Status, incident.Impact, incident.Message, frontendUrl, incident.CreatedAt));
            }
        }

        await _db.SaveChangesAsync();
        return Ok(incident);
    }

    [HttpPost("{id:guid}/updates")]
    public async Task<IActionResult> AddIncidentUpdate(Guid id, [FromBody] AddIncidentUpdateRequest req)
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();
        if (tenantId == null) return Unauthorized();

        var incident = await _db.Incidents.Include(i => i.Updates).FirstOrDefaultAsync(i => i.Id == id);
        if (incident == null) return NotFound();

        var newStatus = string.IsNullOrWhiteSpace(req.Status) ? incident.Status : req.Status;
        incident.Status = newStatus;
        incident.Message = req.Message;
        incident.UpdatedAt = DateTime.UtcNow;

        var update = new IncidentUpdate
        {
            TenantId = tenantId.Value,
            IncidentId = incident.Id,
            Status = newStatus,
            Message = req.Message,
            CreatedAt = DateTime.UtcNow
        };

        _db.IncidentUpdates.Add(update);
        await _db.SaveChangesAsync();

        var subscribers = await _db.Subscribers
            .Where(s => s.StatusPageId == incident.StatusPageId && s.IsConfirmed)
            .ToListAsync();

        var page = await _db.StatusPages.FirstOrDefaultAsync(sp => sp.Id == incident.StatusPageId);
        if (page != null)
        {
            var frontendUrl = (_configuration["FRONTEND_URL"] ?? "http://localhost:3000").TrimEnd('/');

            foreach (var sub in subscribers)
            {
                _db.EmailJobs.Add(BuildIncidentJob(sub, page, incident.Title, newStatus, incident.Impact, req.Message, frontendUrl, update.CreatedAt));
            }
        }

        await _db.SaveChangesAsync();
        return Ok(incident);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateIncident(Guid id, [FromBody] UpdateIncidentRequest req)
    {
        var incident = await _db.Incidents.Include(i => i.Updates).FirstOrDefaultAsync(i => i.Id == id);
        if (incident == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.Title))
        {
            incident.Title = req.Title;
        }
        incident.Status = req.Status;
        incident.Impact = req.Impact;
        incident.Message = req.Message;
        incident.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(incident);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteIncident(Guid id)
    {
        var incident = await _db.Incidents.FirstOrDefaultAsync(i => i.Id == id);
        if (incident == null) return NotFound();

        _db.Incidents.Remove(incident);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Incident deleted." });
    }

    private static EmailJob BuildIncidentJob(Subscriber sub, StatusPage page, string title, string status, string impact, string message, string frontendUrl, DateTime updateTime)
    {
        var (color, background) = EmailTemplates.StatusColors(status);

        var variables = new Dictionary<string, string>
        {
            ["LOGO_URL"] = $"{frontendUrl}/logo.png",
            ["INCIDENT_TITLE"] = title,
            ["STATUS_LABEL"] = status,
            ["STATUS_COLOR"] = color,
            ["STATUS_BG"] = background,
            ["IMPACT"] = impact,
            ["MESSAGE"] = message,
            ["STATUS_PAGE_NAME"] = page.Name,
            ["STATUS_PAGE_URL"] = $"{frontendUrl}/status/{page.Slug}",
            ["UPDATE_TIME"] = updateTime.ToUniversalTime().ToString("MMM d, yyyy 'at' HH:mm 'UTC'"),
            ["APP_URL"] = frontendUrl,
            ["APP_NAME"] = EmailTemplates.AppName
        };

        return new EmailJob
        {
            TenantId = page.TenantId,
            RecipientEmail = sub.Email,
            Subject = $"[Incident Update - {status}] {title}",
            TemplateId = EmailTemplates.IncidentUpdate,
            TemplateDataJson = System.Text.Json.JsonSerializer.Serialize(variables)
        };
    }
}
