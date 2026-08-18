using System.Text.Json.Serialization;

namespace StatusEnzin.Api.Models;

public class MonitorCheck
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MonitorId { get; set; }

    [JsonIgnore]
    public Monitor Monitor { get; set; } = null!;

    public Guid TenantId { get; set; }

    public int StatusCode { get; set; }
    public int ResponseTimeMs { get; set; }
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }

    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
}
