using System.Text.Json.Serialization;

namespace StatusEnzin.Api.Models;

public class StatusPage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }

    [JsonIgnore]
    public Tenant Tenant { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty; // e.g. "acme" for /status/acme
    public string Description { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = true;
    public string ComponentIdsJson { get; set; } = "[]"; // List of Monitor IDs included
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Incident> Incidents { get; set; } = new List<Incident>();
    public ICollection<Subscriber> Subscribers { get; set; } = new List<Subscriber>();
}
