namespace StatusEnzin.Api.Models;

public class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string PlanType { get; set; } = "Starter"; // Starter, Pro, Business
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsSuspended { get; set; } = false;
    public string? SuspensionReason { get; set; }
    public DateTime? SuspendedAt { get; set; }

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Monitor> Monitors { get; set; } = new List<Monitor>();
    public ICollection<StatusPage> StatusPages { get; set; } = new List<StatusPage>();
    public Subscription? Subscription { get; set; }
}
