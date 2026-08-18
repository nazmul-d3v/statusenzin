using System.Text.Json.Serialization;

namespace StatusEnzin.Api.Models;

public class Subscriber
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StatusPageId { get; set; }

    [JsonIgnore]
    public StatusPage StatusPage { get; set; } = null!;

    public string Email { get; set; } = string.Empty;
    public bool IsConfirmed { get; set; } = false;
    public string ConfirmationToken { get; set; } = Guid.NewGuid().ToString("N");
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
