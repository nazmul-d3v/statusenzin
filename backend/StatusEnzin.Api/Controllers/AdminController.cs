using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StatusEnzin.Api.Data;

namespace StatusEnzin.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db)
    {
        _db = db;
    }

    private bool IsAdmin()
    {
        var isAdminClaim = User.FindFirst("IsPlatformAdmin")?.Value;
        return bool.TryParse(isAdminClaim, out var isAdmin) && isAdmin;
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants()
    {
        if (!IsAdmin()) return Forbid("Platform Admin privileges required.");

        var tenants = await _db.Tenants
            .IgnoreQueryFilters()
            .Include(t => t.Users)
            .Include(t => t.Monitors)
            .Include(t => t.StatusPages)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.PlanType,
                t.CreatedAt,
                t.IsSuspended,
                t.SuspensionReason,
                t.SuspendedAt,
                UserCount = t.Users.Count,
                MonitorCount = t.Monitors.Count,
                StatusPageCount = t.StatusPages.Count
            })
            .ToListAsync();

        return Ok(tenants);
    }

    [HttpPost("tenants/{id}/suspend")]
    public async Task<IActionResult> SuspendTenant(Guid id, [FromBody] SuspendTenantRequest request)
    {
        if (!IsAdmin()) return Forbid("Platform Admin privileges required.");

        var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == id);
        if (tenant == null) return NotFound("Tenant not found.");

        tenant.IsSuspended = true;
        tenant.SuspensionReason = string.IsNullOrWhiteSpace(request?.Reason) ? "Suspended by platform administrator" : request.Reason;
        tenant.SuspendedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { Message = "Tenant suspended successfully.", tenant.Id, tenant.IsSuspended, tenant.SuspensionReason });
    }

    [HttpPost("tenants/{id}/unsuspend")]
    public async Task<IActionResult> UnsuspendTenant(Guid id)
    {
        if (!IsAdmin()) return Forbid("Platform Admin privileges required.");

        var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == id);
        if (tenant == null) return NotFound("Tenant not found.");

        tenant.IsSuspended = false;
        tenant.SuspensionReason = null;
        tenant.SuspendedAt = null;

        await _db.SaveChangesAsync();
        return Ok(new { Message = "Tenant unsuspended successfully.", tenant.Id, tenant.IsSuspended });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetPlatformStats()
    {
        if (!IsAdmin()) return Forbid("Platform Admin privileges required.");

        var totalTenants = await _db.Tenants.IgnoreQueryFilters().CountAsync();
        var activeTenants = await _db.Tenants.IgnoreQueryFilters().CountAsync(t => !t.IsSuspended);
        var suspendedTenants = await _db.Tenants.IgnoreQueryFilters().CountAsync(t => t.IsSuspended);

        var totalMonitors = await _db.Monitors.IgnoreQueryFilters().CountAsync();
        var totalChecks = await _db.MonitorChecks.IgnoreQueryFilters().CountAsync();
        var totalIncidents = await _db.Incidents.IgnoreQueryFilters().CountAsync();

        // Revenue & Subscription distribution
        var subscriptions = await _db.Subscriptions.IgnoreQueryFilters().ToListAsync();
        var tenantPlans = await _db.Tenants.IgnoreQueryFilters()
            .Select(t => new { t.PlanType, t.IsSuspended })
            .ToListAsync();

        int starterCount = tenantPlans.Count(t => t.PlanType.Equals("Starter", StringComparison.OrdinalIgnoreCase));
        int proCount = tenantPlans.Count(t => t.PlanType.Equals("Pro", StringComparison.OrdinalIgnoreCase));
        int businessCount = tenantPlans.Count(t => t.PlanType.Equals("Business", StringComparison.OrdinalIgnoreCase));

        // Active paying subscriptions (ignoring suspended tenants)
        decimal mrr = (proCount * 15m) + (businessCount * 49m);
        decimal arr = mrr * 12m;

        int canceledSubscriptions = subscriptions.Count(s => s.Status.Equals("canceled", StringComparison.OrdinalIgnoreCase));
        int totalSubscriptions = subscriptions.Count;
        double churnRate = totalSubscriptions > 0 ? Math.Round((double)canceledSubscriptions / totalSubscriptions * 100.0, 2) : 0;

        return Ok(new
        {
            TotalTenants = totalTenants,
            ActiveTenants = activeTenants,
            SuspendedTenants = suspendedTenants,
            TotalMonitors = totalMonitors,
            TotalChecks = totalChecks,
            TotalIncidents = totalIncidents,
            Revenue = new
            {
                Mrr = mrr,
                Arr = arr,
                StarterCount = starterCount,
                ProCount = proCount,
                BusinessCount = businessCount
            },
            Churn = new
            {
                TotalSubscriptions = totalSubscriptions,
                CanceledSubscriptions = canceledSubscriptions,
                ChurnRatePercent = churnRate
            }
        });
    }
}

public class SuspendTenantRequest
{
    public string Reason { get; set; } = string.Empty;
}
