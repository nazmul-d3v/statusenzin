namespace StatusEnzin.Api.Models;

public class Monitor
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public int CheckIntervalSeconds { get; set; } = 300; // 5 min default for Starter
    public int TimeoutSeconds { get; set; } = 10;
    public int ExpectedStatusCode { get; set; } = 200;

    public string Status { get; set; } = "Operational"; // Operational, Degraded, Down
    public int LastLatencyMs { get; set; } = 0;
    public double UptimePercentage { get; set; } = 100.0;

    public DateTime? LastCheckedAt { get; set; }
    public DateTime NextCheckAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MonitorCheck> Checks { get; set; } = new List<MonitorCheck>();
}
