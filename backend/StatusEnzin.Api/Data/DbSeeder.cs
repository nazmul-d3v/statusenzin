using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StatusEnzin.Api.Models;
using Monitor = StatusEnzin.Api.Models.Monitor;

namespace StatusEnzin.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, UserManager<User> userManager, IConfiguration configuration)
    {
        await SeedSuperAdminAsync(db, userManager, configuration);

        if (bool.TryParse(configuration["SEED_DEMO_DATA"], out var seedDemo) && seedDemo)
        {
            await SeedDemoContentAsync(db, configuration);
        }
    }

    private static async Task SeedSuperAdminAsync(AppDbContext db, UserManager<User> userManager, IConfiguration configuration)
    {
        var adminEmail = configuration["SUPER_ADMIN_EMAIL"] ?? "nazmul.d3v@gmail.com";
        var adminPassword = configuration["SUPER_ADMIN_PASSWORD"] ?? "15114600";
        var adminFullName = configuration["SUPER_ADMIN_FULL_NAME"]
            ?? configuration["SUPER_ADMIN_NAME"]
            ?? "Nazmul Dev Admin";
        var adminTenantName = configuration["SUPER_ADMIN_TENANT_NAME"]
            ?? configuration["SUPER_ADMIN_ORGANIZATION"]
            ?? "Acme Cloud Infrastructure";

        var admin = await userManager.FindByEmailAsync(adminEmail);
        if (admin != null) return;

        var tenant = new Tenant
        {
            Name = adminTenantName,
            PlanType = "Pro",
            CreatedAt = DateTime.UtcNow
        };
        db.Tenants.Add(tenant);

        var nameParts = adminFullName.Split(' ', 2);
        admin = new User
        {
            UserName = adminEmail,
            Email = adminEmail,
            FullName = adminFullName,
            FirstName = nameParts.Length > 0 ? nameParts[0] : adminFullName,
            LastName = nameParts.Length > 1 ? nameParts[1] : "",
            TenantId = tenant.Id,
            IsPlatformAdmin = true
        };

        var createResult = await userManager.CreateAsync(admin, adminPassword);
        if (!createResult.Succeeded)
        {
            var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to create Super Admin user from .env settings: {errors}");
        }

        db.Subscriptions.Add(new Subscription
        {
            TenantId = tenant.Id,
            PlanType = "Pro",
            Status = "active"
        });

        await db.SaveChangesAsync();
    }

    private static async Task SeedDemoContentAsync(AppDbContext db, IConfiguration configuration)
    {
        var adminEmail = configuration["SUPER_ADMIN_EMAIL"] ?? "admin@statusenzin.me";
        var admin = await db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == adminEmail);
        if (admin == null) return;

        var tenantId = admin.TenantId;

        var existingPage = await db.StatusPages.IgnoreQueryFilters().FirstOrDefaultAsync(sp => sp.Slug == "acme");
        if (existingPage != null) return;

        var m1 = new Monitor
        {
            TenantId = tenantId,
            Name = "Core API Gateway",
            Url = "https://httpbin.org/status/200",
            CheckIntervalSeconds = 60,
            Status = "Operational",
            NextCheckAt = DateTime.UtcNow
        };
        var m2 = new Monitor
        {
            TenantId = tenantId,
            Name = "Auth & Identity Service",
            Url = "https://httpbin.org/anything",
            CheckIntervalSeconds = 60,
            Status = "Operational",
            NextCheckAt = DateTime.UtcNow
        };
        var m3 = new Monitor
        {
            TenantId = tenantId,
            Name = "CDN & Edge Cache",
            Url = "https://httpbin.org/ip",
            CheckIntervalSeconds = 60,
            Status = "Operational",
            NextCheckAt = DateTime.UtcNow
        };
        db.Monitors.AddRange(m1, m2, m3);
        await db.SaveChangesAsync();

        // Seed 90 days of realistic check history so the uptime bars render green/amber/red
        var seedNow = DateTime.UtcNow;
        var rng = new Random(20260806);

        var failureProfiles = new Dictionary<Guid, Dictionary<int, int>>
        {
            [m1.Id] = new() { [12] = 8, [33] = 2, [58] = 2, [76] = 3 },
            [m2.Id] = new(),
            [m3.Id] = new() { [21] = 2, [45] = 5, [63] = 1 }
        };

        const int checksPerDay = 8; // every 3 hours: 02:00, 05:00, ... 23:00 UTC
        var seededChecks = new List<MonitorCheck>();

        foreach (var monitor in new[] { m1, m2, m3 })
        {
            var profile = failureProfiles[monitor.Id];
            int successCount = 0;
            int totalCount = 0;
            MonitorCheck? lastCheck = null;

            for (int day = 89; day >= 0; day--)
            {
                var dayStart = seedNow.Date.AddDays(-day);
                int failCount = profile.TryGetValue(day, out var fc) ? fc : 0;

                for (int slot = 0; slot < checksPerDay; slot++)
                {
                    var checkedAt = dayStart.AddHours(2 + 3 * slot);
                    bool isSuccess = slot >= failCount;
                    int latency = 0;
                    string? error = null;

                    if (isSuccess)
                    {
                        latency = rng.Next(18, 140);
                    }
                    else if (rng.Next(0, 100) < 60)
                    {
                        latency = rng.Next(1500, 9000);
                        error = "The operation has timed out.";
                    }
                    else
                    {
                        error = "Connection refused (unreachable upstream).";
                    }

                    var check = new MonitorCheck
                    {
                        MonitorId = monitor.Id,
                        TenantId = monitor.TenantId,
                        StatusCode = isSuccess ? 200 : 0,
                        ResponseTimeMs = latency,
                        IsSuccess = isSuccess,
                        ErrorMessage = error,
                        CheckedAt = checkedAt
                    };

                    seededChecks.Add(check);
                    lastCheck = check;
                    successCount += isSuccess ? 1 : 0;
                    totalCount++;
                }
            }

            monitor.UptimePercentage = Math.Round((double)successCount / totalCount * 100.0, 2);
            if (lastCheck != null)
            {
                monitor.LastLatencyMs = lastCheck.ResponseTimeMs;
                monitor.LastCheckedAt = lastCheck.CheckedAt;
            }
        }

        db.MonitorChecks.AddRange(seededChecks);
        await db.SaveChangesAsync();

        var acmePage = new StatusPage
        {
            TenantId = tenantId,
            Name = "Acme Systems Status",
            Slug = "acme",
            Description = "Real-time system status and incident history for Acme Cloud services.",
            IsPublic = true,
            ComponentIdsJson = JsonSerializer.Serialize(new[] { m1.Id, m2.Id, m3.Id })
        };
        db.StatusPages.Add(acmePage);

        var inc1 = new Incident
        {
            TenantId = tenantId,
            StatusPageId = acmePage.Id,
            Title = "API Gateway Latency Spike in US-East",
            Status = "Monitoring",
            Impact = "Major",
            Message = "A fix has been deployed and engineers are monitoring latency metrics.",
            CreatedAt = DateTime.UtcNow.AddHours(-2),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-15)
        };

        var u1_1 = new IncidentUpdate
        {
            TenantId = tenantId,
            IncidentId = inc1.Id,
            Status = "Investigating",
            Message = "Engineers are investigating reports of elevated API latency and timeout errors across the US-East edge cluster.",
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };
        var u1_2 = new IncidentUpdate
        {
            TenantId = tenantId,
            IncidentId = inc1.Id,
            Status = "Identified",
            Message = "The root cause was identified as a routing loop in our upstream BGP peer. Network engineers are applying route filtering.",
            CreatedAt = DateTime.UtcNow.AddHours(-1).AddMinutes(-20)
        };
        var u1_3 = new IncidentUpdate
        {
            TenantId = tenantId,
            IncidentId = inc1.Id,
            Status = "Monitoring",
            Message = "BGP filters applied. Traffic has normalized and latency metrics are recovering. We are monitoring performance.",
            CreatedAt = DateTime.UtcNow.AddMinutes(-15)
        };

        var inc2 = new Incident
        {
            TenantId = tenantId,
            StatusPageId = acmePage.Id,
            Title = "Scheduled Database Cluster Upgrade",
            Status = "Resolved",
            Impact = "Minor",
            Message = "Database cluster maintenance has completed successfully. All systems are fully operational.",
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            UpdatedAt = DateTime.UtcNow.AddDays(-2).AddHours(2)
        };

        var u2_1 = new IncidentUpdate
        {
            TenantId = tenantId,
            IncidentId = inc2.Id,
            Status = "Investigating",
            Message = "Scheduled maintenance window starting. Read-only replicas will undergo rolling software upgrades.",
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        };
        var u2_2 = new IncidentUpdate
        {
            TenantId = tenantId,
            IncidentId = inc2.Id,
            Status = "Resolved",
            Message = "Database maintenance has completed successfully. All read/write nodes are healthy and operating at 100% capacity.",
            CreatedAt = DateTime.UtcNow.AddDays(-2).AddHours(2)
        };

        var gatewayOutageDay = seedNow.AddDays(-12);
        var inc3 = new Incident
        {
            TenantId = tenantId,
            StatusPageId = acmePage.Id,
            Title = "API Gateway Outage in US-East",
            Status = "Resolved",
            Impact = "Major",
            Message = "Upstream provider fault was mitigated and all gateway traffic returned to normal levels.",
            CreatedAt = gatewayOutageDay.AddHours(-4),
            UpdatedAt = gatewayOutageDay.AddHours(2)
        };

        var u3_1 = new IncidentUpdate
        {
            TenantId = tenantId,
            IncidentId = inc3.Id,
            Status = "Investigating",
            Message = "Elevated error rates detected on the API gateway. Requests to several endpoints are failing with 502 responses.",
            CreatedAt = gatewayOutageDay.AddHours(-4)
        };
        var u3_2 = new IncidentUpdate
        {
            TenantId = tenantId,
            IncidentId = inc3.Id,
            Status = "Identified",
            Message = "An upstream provider fault in the US-East region was identified as the cause of the gateway errors.",
            CreatedAt = gatewayOutageDay.AddHours(-1)
        };
        var u3_3 = new IncidentUpdate
        {
            TenantId = tenantId,
            IncidentId = inc3.Id,
            Status = "Resolved",
            Message = "The upstream provider confirmed the fault is resolved. Gateway latency and error metrics have returned to normal.",
            CreatedAt = gatewayOutageDay.AddHours(2)
        };

        var cdnOutageDay = seedNow.AddDays(-45);
        var inc4 = new Incident
        {
            TenantId = tenantId,
            StatusPageId = acmePage.Id,
            Title = "CDN Edge Cache Failures in EU-West",
            Status = "Resolved",
            Impact = "Minor",
            Message = "Edge cache nodes recovered after an automated rolling restart. Cache hit ratio has been restored.",
            CreatedAt = cdnOutageDay.AddHours(-2),
            UpdatedAt = cdnOutageDay.AddHours(3)
        };

        var u4_1 = new IncidentUpdate
        {
            TenantId = tenantId,
            IncidentId = inc4.Id,
            Status = "Investigating",
            Message = "A subset of edge cache nodes in EU-West began returning origin-fetch errors, causing elevated latency for cached assets.",
            CreatedAt = cdnOutageDay.AddHours(-2)
        };
        var u4_2 = new IncidentUpdate
        {
            TenantId = tenantId,
            IncidentId = inc4.Id,
            Status = "Resolved",
            Message = "Affected nodes completed a rolling restart and cache hit ratios have recovered to normal levels.",
            CreatedAt = cdnOutageDay.AddHours(3)
        };

        db.Incidents.AddRange(inc1, inc2, inc3, inc4);
        db.IncidentUpdates.AddRange(u1_1, u1_2, u1_3, u2_1, u2_2, u3_1, u3_2, u3_3, u4_1, u4_2);
        await db.SaveChangesAsync();
    }
}
