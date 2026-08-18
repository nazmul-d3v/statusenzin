using Microsoft.AspNetCore.Identity;

namespace StatusEnzin.Api.Models;

public class User : IdentityUser
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string FullName { get; set; } = string.Empty;
    public bool IsPlatformAdmin { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
