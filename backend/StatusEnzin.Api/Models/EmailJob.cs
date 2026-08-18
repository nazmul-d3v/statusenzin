namespace StatusEnzin.Api.Models;

public class EmailJob
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }

    public string RecipientEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string BodyHtml { get; set; } = string.Empty;

    public string? TemplateId { get; set; }
    public string? TemplateDataJson { get; set; }

    public string Status { get; set; } = "Pending"; // Pending, Sent, Failed
    public string? ErrorMessage { get; set; }
    public int Attempts { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SentAt { get; set; }
}
