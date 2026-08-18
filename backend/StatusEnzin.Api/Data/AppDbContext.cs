using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StatusEnzin.Api.Models;
using Monitor = StatusEnzin.Api.Models.Monitor;

namespace StatusEnzin.Api.Data;

public class AppDbContext : IdentityDbContext<User>
{
    private readonly ITenantProvider? _tenantProvider;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantProvider? tenantProvider = null)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Monitor> Monitors => Set<Monitor>();
    public DbSet<MonitorCheck> MonitorChecks => Set<MonitorCheck>();
    public DbSet<StatusPage> StatusPages => Set<StatusPage>();
    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<IncidentUpdate> IncidentUpdates => Set<IncidentUpdate>();
    public DbSet<Subscriber> Subscribers => Set<Subscriber>();
    public DbSet<EmailJob> EmailJobs => Set<EmailJob>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Multi-tenant query filters
        builder.Entity<User>().HasQueryFilter(u => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || u.TenantId == _tenantProvider.GetCurrentTenantId());
        builder.Entity<Monitor>().HasQueryFilter(m => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || m.TenantId == _tenantProvider.GetCurrentTenantId());
        builder.Entity<MonitorCheck>().HasQueryFilter(mc => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || mc.TenantId == _tenantProvider.GetCurrentTenantId());
        builder.Entity<StatusPage>().HasQueryFilter(sp => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || sp.TenantId == _tenantProvider.GetCurrentTenantId());
        builder.Entity<Incident>().HasQueryFilter(i => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || i.TenantId == _tenantProvider.GetCurrentTenantId());
        builder.Entity<IncidentUpdate>().HasQueryFilter(iu => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || iu.TenantId == _tenantProvider.GetCurrentTenantId());
        builder.Entity<EmailJob>().HasQueryFilter(ej => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || ej.TenantId == _tenantProvider.GetCurrentTenantId());
        builder.Entity<Subscription>().HasQueryFilter(s => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || s.TenantId == _tenantProvider.GetCurrentTenantId());

        // Indices
        builder.Entity<Tenant>().HasIndex(t => t.Name);
        builder.Entity<StatusPage>().HasIndex(sp => sp.Slug).IsUnique();
        builder.Entity<MonitorCheck>().HasIndex(mc => new { mc.MonitorId, mc.CheckedAt });
        builder.Entity<PasswordResetToken>().HasIndex(t => t.Token).IsUnique();
    }
}
