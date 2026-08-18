namespace StatusEnzin.Api.Models;

public class Subscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public string StripeCustomerId { get; set; } = string.Empty;
    public string StripeSubscriptionId { get; set; } = string.Empty;
    public string StripePriceId { get; set; } = string.Empty;
    public string PlanType { get; set; } = "Starter"; // Starter, Pro, Business
    public string BillingCycle { get; set; } = "monthly"; // monthly, annual
    public string Status { get; set; } = "active"; // active, canceled, past_due
    public DateTime? CurrentPeriodEnd { get; set; }
    public string? PendingPlanType { get; set; } // Deferred downgrade target, applied when CurrentPeriodEnd passes
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
