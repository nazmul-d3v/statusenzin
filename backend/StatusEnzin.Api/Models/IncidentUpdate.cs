using System.Text.Json.Serialization;

namespace StatusEnzin.Api.Models;

public class IncidentUpdate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid IncidentId { get; set; }

    [JsonIgnore]
    public Incident Incident { get; set; } = null!;

    public string Status { get; set; } = "Investigating"; // Investigating, Identified, Monitoring, Resolved
    public string Message { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
