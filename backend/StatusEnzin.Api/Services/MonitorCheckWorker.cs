using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using StatusEnzin.Api.Data;
using StatusEnzin.Api.Models;
using Monitor = StatusEnzin.Api.Models.Monitor;

namespace StatusEnzin.Api.Services;

public class MonitorCheckWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MonitorCheckWorker> _logger;
    private readonly IConfiguration _configuration;
    private readonly PeriodicTimer _timer;

    public MonitorCheckWorker(IServiceProvider serviceProvider, ILogger<MonitorCheckWorker> logger, IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _configuration = configuration;

        var intervalSec = int.TryParse(_configuration["MONITOR_CHECK_INTERVAL_SECONDS"], out var sec) ? sec : 15;
        _timer = new PeriodicTimer(TimeSpan.FromSeconds(intervalSec));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("StatusEnzin MonitorCheckWorker started.");

        while (await _timer.WaitForNextTickAsync(stoppingToken) && !stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunDueMonitorChecksAsync(stoppingToken);
                await ProcessPendingDowngradesAsync(stoppingToken);
                await ProcessEmailQueueAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in MonitorCheckWorker background loop.");
            }
        }
    }

    private async Task RunDueMonitorChecksAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        try
        {
            var now = DateTime.UtcNow;
            var suspendedTenantIds = await db.Tenants
                .IgnoreQueryFilters()
                .Where(t => t.IsSuspended)
                .Select(t => t.Id)
                .ToListAsync(stoppingToken);

            var dueMonitors = await db.Monitors
                .IgnoreQueryFilters()
                .Where(m => m.NextCheckAt <= now && !suspendedTenantIds.Contains(m.TenantId))
                .Take(50)
                .ToListAsync(stoppingToken);

        if (dueMonitors.Count == 0) return;

        var timeoutSec = int.TryParse(_configuration["MONITOR_HTTP_TIMEOUT_SECONDS"], out var tSec) ? tSec : 15;
        using var client = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(timeoutSec)
        };

        foreach (var monitor in dueMonitors)
        {
            var stopwatch = Stopwatch.StartNew();
            var previousStatus = monitor.Status;
            int statusCode = 0;
            bool isSuccess = false;
            string? errorMessage = null;

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, monitor.Url);
                request.Headers.Add("User-Agent", "StatusEnzin-UptimeBot/1.0");

                var response = await client.SendAsync(request, stoppingToken);
                stopwatch.Stop();

                statusCode = (int)response.StatusCode;
                isSuccess = statusCode == monitor.ExpectedStatusCode || (statusCode >= 200 && statusCode < 400);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                statusCode = 0;
                isSuccess = false;
                errorMessage = ex.Message;
            }

            int latencyMs = (int)stopwatch.ElapsedMilliseconds;

            var check = new MonitorCheck
            {
                MonitorId = monitor.Id,
                TenantId = monitor.TenantId,
                StatusCode = statusCode,
                ResponseTimeMs = latencyMs,
                IsSuccess = isSuccess,
                ErrorMessage = errorMessage,
                CheckedAt = now
            };

            db.MonitorChecks.Add(check);

            monitor.LastLatencyMs = latencyMs;
            monitor.LastCheckedAt = now;
            monitor.NextCheckAt = now.AddSeconds(monitor.CheckIntervalSeconds);
            monitor.Status = isSuccess ? "Operational" : "Down";

            if (previousStatus != "Down" && !isSuccess)
            {
                await QueueMonitorAlertAsync(db, monitor, isDown: true, errorMessage, now, stoppingToken);
            }
            else if (previousStatus == "Down" && isSuccess)
            {
                await QueueMonitorAlertAsync(db, monitor, isDown: false, null, now, stoppingToken);
            }

            // Calculate rolling uptime percentage over last 100 checks
            var recentChecks = await db.MonitorChecks
                .IgnoreQueryFilters()
                .Where(c => c.MonitorId == monitor.Id)
                .OrderByDescending(c => c.CheckedAt)
                .Take(99)
                .Select(c => c.IsSuccess)
                .ToListAsync(stoppingToken);

            recentChecks.Add(isSuccess);
            double uptime = (double)recentChecks.Count(x => x) / recentChecks.Count * 100.0;
            monitor.UptimePercentage = Math.Round(uptime, 2);

            _logger.LogInformation("Monitor Check: {Name} ({Url}) -> Status {Status} ({StatusCode}, {Latency}ms)", monitor.Name, monitor.Url, monitor.Status, statusCode, latencyMs);
        }

        await db.SaveChangesAsync(stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("MonitorCheckWorker waiting for database: {Message}", ex.Message);
        }
    }

    private async Task ProcessPendingDowngradesAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTime.UtcNow;
        var dueSubs = await db.Subscriptions
            .IgnoreQueryFilters()
            .Where(s => s.PendingPlanType != null && s.CurrentPeriodEnd != null && s.CurrentPeriodEnd <= now)
            .ToListAsync(stoppingToken);

        foreach (var sub in dueSubs)
        {
            var tenant = await db.Tenants
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Id == sub.TenantId, stoppingToken);

            var previousPlan = tenant?.PlanType ?? sub.PlanType;
            var targetPlan = sub.PendingPlanType!;

            if (tenant != null)
            {
                tenant.PlanType = targetPlan;
            }

            sub.PlanType = targetPlan;
            sub.PendingPlanType = null;

            // Stripe-managed subscriptions keep their Stripe ids — the change is applied by
            // Stripe at the period boundary and synced back via webhook. Local (mock) subs
            // are reset entirely.
            if (string.IsNullOrWhiteSpace(sub.StripeSubscriptionId))
            {
                sub.StripePriceId = string.Empty;
                sub.CurrentPeriodEnd = null;
            }

            _logger.LogInformation("Applied pending downgrade for tenant {TenantId}: -> {Plan}", sub.TenantId, sub.PlanType);

            await QueueDowngradeAppliedAsync(db, sub.TenantId, previousPlan, targetPlan, DateTime.UtcNow);
        }

        if (dueSubs.Count > 0)
        {
            await db.SaveChangesAsync(stoppingToken);
        }
    }

    private async Task ProcessEmailQueueAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var pendingEmails = await db.EmailJobs
            .IgnoreQueryFilters()
            .Where(e => e.Status == "Pending" && e.Attempts < 3)
            .Take(10)
            .ToListAsync(stoppingToken);

        foreach (var job in pendingEmails)
        {
            try
            {
                job.Attempts++;
                if (!string.IsNullOrWhiteSpace(job.TemplateId) && !string.IsNullOrWhiteSpace(job.TemplateDataJson))
                {
                    var variables = System.Text.Json.JsonSerializer
                        .Deserialize<Dictionary<string, string>>(job.TemplateDataJson) ?? new();
                    await emailService.SendTemplatedEmailAsync(job.RecipientEmail, job.Subject, job.TemplateId, variables);
                }
                else
                {
                    await emailService.SendEmailAsync(job.RecipientEmail, job.Subject, job.BodyHtml);
                }
                job.Status = "Sent";
                job.SentAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                job.ErrorMessage = ex.Message;
                if (job.Attempts >= 3)
                {
                    job.Status = "Failed";
                }
            }
        }

        if (pendingEmails.Count > 0)
        {
            await db.SaveChangesAsync(stoppingToken);
        }
    }

    private async Task QueueMonitorAlertAsync(AppDbContext db, Monitor monitor, bool isDown, string? errorMessage, DateTime now, CancellationToken stoppingToken)
    {
        var owner = await db.Users
            .IgnoreQueryFilters()
            .Where(u => u.TenantId == monitor.TenantId)
            .OrderBy(u => u.CreatedAt)
            .FirstOrDefaultAsync(stoppingToken);

        if (owner?.Email == null) return;

        var frontendUrl = (_configuration["FRONTEND_URL"] ?? "http://localhost:3000").TrimEnd('/');
        var checkedTime = now.ToUniversalTime().ToString("MMM d, yyyy 'at' HH:mm 'UTC'");

        var variables = new Dictionary<string, string>
        {
            ["LOGO_URL"] = $"{frontendUrl}/logo.png",
            ["NAME"] = string.IsNullOrWhiteSpace(owner.FullName) ? owner.Email : owner.FullName,
            ["MONITOR_NAME"] = monitor.Name,
            ["MONITOR_URL"] = monitor.Url,
            ["CHECKED_TIME"] = checkedTime,
            ["DASHBOARD_URL"] = $"{frontendUrl}/dashboard",
            ["APP_URL"] = frontendUrl,
            ["APP_NAME"] = EmailTemplates.AppName
        };

        if (isDown)
        {
            variables["ERROR_MESSAGE"] = string.IsNullOrWhiteSpace(errorMessage)
                ? "Request failed or returned an unexpected status code."
                : errorMessage;
        }
        else
        {
            variables["LATENCY_MS"] = monitor.LastLatencyMs.ToString();
            variables["UPTIME_PERCENT"] = monitor.UptimePercentage.ToString("0.00");
        }

        db.EmailJobs.Add(new EmailJob
        {
            TenantId = monitor.TenantId,
            RecipientEmail = owner.Email,
            Subject = isDown ? $"[Alert] {monitor.Name} is down" : $"[Resolved] {monitor.Name} is back online",
            TemplateId = isDown ? EmailTemplates.MonitorDown : EmailTemplates.MonitorUp,
            TemplateDataJson = System.Text.Json.JsonSerializer.Serialize(variables)
        });

        _logger.LogInformation("Queued {Kind} alert email for monitor {Monitor} to {Owner}",
            isDown ? "down" : "recovery", monitor.Name, owner.Email);
    }

    private async Task QueueDowngradeAppliedAsync(AppDbContext db, Guid tenantId, string previousPlan, string targetPlan, DateTime now)
    {
        var owner = await db.Users
            .IgnoreQueryFilters()
            .Where(u => u.TenantId == tenantId)
            .OrderBy(u => u.CreatedAt)
            .FirstOrDefaultAsync();

        if (owner?.Email == null) return;

        var frontendUrl = (_configuration["FRONTEND_URL"] ?? "http://localhost:3000").TrimEnd('/');
        var variables = new Dictionary<string, string>
        {
            ["LOGO_URL"] = $"{frontendUrl}/logo.png",
            ["NAME"] = string.IsNullOrWhiteSpace(owner.FullName) ? owner.Email : owner.FullName,
            ["HEADLINE"] = "Downgrade complete",
            ["BODY_TEXT"] = $"Your plan has been changed from {previousPlan} to {targetPlan}.",
            ["CURRENT_PLAN"] = previousPlan,
            ["TARGET_PLAN"] = targetPlan,
            ["EFFECTIVE_DATE"] = now.ToUniversalTime().ToString("MMM d, yyyy 'at' HH:mm 'UTC'"),
            ["BILLING_URL"] = $"{frontendUrl}/dashboard/billing",
            ["APP_URL"] = frontendUrl,
            ["APP_NAME"] = EmailTemplates.AppName
        };

        db.EmailJobs.Add(new EmailJob
        {
            TenantId = tenantId,
            RecipientEmail = owner.Email,
            Subject = $"Your StatusEnzin plan has been changed to {targetPlan}",
            TemplateId = EmailTemplates.Downgrade,
            TemplateDataJson = System.Text.Json.JsonSerializer.Serialize(variables)
        });
    }
}
