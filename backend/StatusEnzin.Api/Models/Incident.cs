using System.Text.Json.Serialization;

namespace StatusEnzin.Api.Models;

public class Incident
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }

    public Guid StatusPageId { get; set; }

    [JsonIgnore]
    public StatusPage StatusPage { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "Investigating"; // Investigating, Identified, Monitoring, Resolved
    public string Impact { get; set; } = "Minor"; // Minor, Major, Critical, Degraded
    public string Message { get; set; } = string.Empty;

    public List<IncidentUpdate> Updates { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
