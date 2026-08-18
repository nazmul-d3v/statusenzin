using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StatusEnzin.Api.Data;
using StatusEnzin.Api.DTOs;
using StatusEnzin.Api.Models;
using StatusEnzin.Api.Services;

namespace StatusEnzin.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthController(UserManager<User> userManager, AppDbContext db, IConfiguration configuration)
    {
        _userManager = userManager;
        _db = db;
        _configuration = configuration;
    }

    [HttpPost("signup")]
    public async Task<IActionResult> Signup([FromBody] SignupRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Email and Password are required." });

        if (request.Password.Length < 8 ||
            !request.Password.Any(char.IsUpper) ||
            !request.Password.Any(char.IsLower) ||
            !request.Password.Any(char.IsDigit) ||
            !request.Password.Any(ch => !char.IsLetterOrDigit(ch)))
        {
            return BadRequest(new { message = "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character." });
        }

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
            return BadRequest(new { message = "An account with this email already exists." });

        var tenant = new Tenant
        {
            Name = string.IsNullOrWhiteSpace(request.CompanyName) ? "My Organization" : request.CompanyName,
            PlanType = "Starter"
        };
        _db.Tenants.Add(tenant);

        var nameParts = (request.FullName ?? "").Split(' ', 2);
        var firstName = nameParts.Length > 0 ? nameParts[0] : "";
        var lastName = nameParts.Length > 1 ? nameParts[1] : "";

        var user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = string.IsNullOrWhiteSpace(request.FullName) ? request.Email.Split('@')[0] : request.FullName,
            FirstName = firstName,
            LastName = lastName,
            TenantId = tenant.Id,
            IsPlatformAdmin = false
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

        var sub = new Subscription
        {
            TenantId = tenant.Id,
            PlanType = "Starter",
            Status = "active"
        };
        _db.Subscriptions.Add(sub);

        var frontendUrl = (_configuration["FRONTEND_URL"] ?? "http://localhost:3000").TrimEnd('/');
        _db.EmailJobs.Add(new EmailJob
        {
            TenantId = tenant.Id,
            RecipientEmail = user.Email!,
            Subject = "Welcome to StatusEnzin — your monitoring setup awaits",
            TemplateId = EmailTemplates.Welcome,
            TemplateDataJson = System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, string>
            {
                ["LOGO_URL"] = $"{frontendUrl}/logo.png",
                ["NAME"] = string.IsNullOrWhiteSpace(user.FullName) ? user.Email!.Split('@')[0] : user.FullName,
                ["DASHBOARD_URL"] = $"{frontendUrl}/dashboard",
                ["APP_URL"] = frontendUrl,
                ["APP_NAME"] = EmailTemplates.AppName
            })
        });

        await _db.SaveChangesAsync();

        var token = GenerateJwtToken(user, tenant);
        SetAuthCookie(token);

        return Ok(CreateAuthResponse(token, user, tenant));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return Unauthorized(new { message = "Invalid email or password." });

        var isValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isValid)
            return Unauthorized(new { message = "Invalid email or password." });

        var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == user.TenantId);
        if (tenant == null)
            return Unauthorized(new { message = "Tenant account not found." });

        if (tenant.IsSuspended && !user.IsPlatformAdmin)
        {
            return StatusCode(403, new { message = $"Your account has been suspended by platform administration: {tenant.SuspensionReason ?? "Violation of terms or policy."}" });
        }

        var token = GenerateJwtToken(user, tenant);
        SetAuthCookie(token);

        return Ok(CreateAuthResponse(token, user, tenant));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == user.TenantId);

        if (tenant != null && tenant.IsSuspended && !user.IsPlatformAdmin)
        {
            return StatusCode(403, new { message = $"Your account has been suspended: {tenant.SuspensionReason ?? "Contact platform support."}" });
        }

        return Ok(CreateAuthResponse("", user, tenant));
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.FirstName) && string.IsNullOrWhiteSpace(request.LastName))
        {
            return BadRequest(new { message = "First Name or Last Name must be provided." });
        }

        user.FirstName = request.FirstName?.Trim() ?? "";
        user.LastName = request.LastName?.Trim() ?? "";
        user.FullName = $"{user.FirstName} {user.LastName}".Trim();

        if (!string.IsNullOrWhiteSpace(request.Email) && request.Email != user.Email)
        {
            var existing = await _userManager.FindByEmailAsync(request.Email);
            if (existing != null && existing.Id != user.Id)
            {
                return BadRequest(new { message = "This email is already in use by another account." });
            }
            user.Email = request.Email;
            user.UserName = request.Email;
        }

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(new { message = string.Join(", ", updateResult.Errors.Select(e => e.Description)) });
        }

        var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == user.TenantId);
        return Ok(CreateAuthResponse("", user, tenant));
    }

    [Authorize]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new { message = "Current password and new password are required." });
        }

        if (request.NewPassword.Length < 8 ||
            !request.NewPassword.Any(char.IsUpper) ||
            !request.NewPassword.Any(char.IsLower) ||
            !request.NewPassword.Any(char.IsDigit) ||
            !request.NewPassword.Any(ch => !char.IsLetterOrDigit(ch)))
        {
            return BadRequest(new { message = "New password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character." });
        }

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
        }

        QueuePasswordChangedEmail(user);

        return Ok(new { message = "Password changed successfully." });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("statusenzin_jwt");
        return Ok(new { message = "Logged out successfully" });
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "Email is required." });

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return Ok(new { message = "If an account exists for this email, a password reset link has been sent." });

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);

        var oldTokens = await _db.PasswordResetTokens
            .IgnoreQueryFilters()
            .Where(t => t.UserId == user.Id && !t.IsUsed)
            .ToListAsync();
        foreach (var old in oldTokens)
        {
            old.IsUsed = true;
        }

        _db.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = user.Id,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        });

        var frontendUrl = (_configuration["FRONTEND_URL"] ?? "http://localhost:3000").TrimEnd('/');
        var resetLink = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(token)}";

        _db.EmailJobs.Add(new EmailJob
        {
            TenantId = user.TenantId,
            RecipientEmail = user.Email!,
            Subject = "Reset your StatusEnzin password",
            TemplateId = EmailTemplates.ResetPassword,
            TemplateDataJson = System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, string>
            {
                ["LOGO_URL"] = $"{frontendUrl}/logo.png",
                ["NAME"] = string.IsNullOrWhiteSpace(user.FullName) ? user.Email!.Split('@')[0] : user.FullName,
                ["RESET_LINK"] = resetLink,
                ["EXPIRE_HOURS"] = "1 hour",
                ["APP_URL"] = frontendUrl,
                ["APP_NAME"] = EmailTemplates.AppName
            })
        });

        await _db.SaveChangesAsync();

        return Ok(new { message = "If an account exists for this email, a password reset link has been sent." });
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest(new { message = "Reset token and new password are required." });

        if (request.NewPassword.Length < 8 ||
            !request.NewPassword.Any(char.IsUpper) ||
            !request.NewPassword.Any(char.IsLower) ||
            !request.NewPassword.Any(char.IsDigit) ||
            !request.NewPassword.Any(ch => !char.IsLetterOrDigit(ch)))
        {
            return BadRequest(new { message = "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character." });
        }

        var resetToken = await _db.PasswordResetTokens
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Token == request.Token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

        if (resetToken == null)
            return BadRequest(new { message = "This password reset link is invalid or has expired. Please request a new one." });

        var user = await _userManager.FindByIdAsync(resetToken.UserId);
        if (user == null)
            return BadRequest(new { message = "This password reset link is invalid or has expired. Please request a new one." });

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

        resetToken.IsUsed = true;
        QueuePasswordChangedEmail(user);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Your password has been reset successfully. You can now sign in with your new password." });
    }

    private void QueuePasswordChangedEmail(User user)
    {
        var frontendUrl = (_configuration["FRONTEND_URL"] ?? "http://localhost:3000").TrimEnd('/');

        _db.EmailJobs.Add(new EmailJob
        {
            TenantId = user.TenantId,
            RecipientEmail = user.Email!,
            Subject = "Your StatusEnzin password was changed",
            TemplateId = EmailTemplates.PasswordChanged,
            TemplateDataJson = System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, string>
            {
                ["LOGO_URL"] = $"{frontendUrl}/logo.png",
                ["NAME"] = string.IsNullOrWhiteSpace(user.FullName) ? user.Email!.Split('@')[0] : user.FullName,
                ["CHANGED_TIME"] = DateTime.UtcNow.ToString("MMM d, yyyy 'at' HH:mm 'UTC'"),
                ["RESET_LINK"] = $"{frontendUrl}/forgot-password",
                ["APP_URL"] = frontendUrl,
                ["APP_NAME"] = EmailTemplates.AppName
            })
        });
    }

    private AuthResponse CreateAuthResponse(string token, User user, Tenant? tenant)
    {
        var nameParts = (user.FullName ?? "").Split(' ', 2);
        var firstName = !string.IsNullOrWhiteSpace(user.FirstName)
            ? user.FirstName
            : (nameParts.Length > 0 ? nameParts[0] : "");
        var lastName = !string.IsNullOrWhiteSpace(user.LastName)
            ? user.LastName
            : (nameParts.Length > 1 ? nameParts[1] : "");
        var fullName = string.IsNullOrWhiteSpace(user.FullName)
            ? $"{firstName} {lastName}".Trim()
            : user.FullName;

        return new AuthResponse(
            token,
            user.Email!,
            fullName,
            firstName,
            lastName,
            user.TenantId,
            tenant?.Name ?? "Organization",
            tenant?.PlanType ?? "Starter",
            user.IsPlatformAdmin
        );
    }

    private string GenerateJwtToken(User user, Tenant tenant)
    {
        var secret = _configuration["Jwt:Key"] ?? "StatusEnzinSuperSecretKeyForJWTAuth2026!MustBeVeryLong";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim("TenantId", user.TenantId.ToString()),
            new Claim("IsPlatformAdmin", user.IsPlatformAdmin.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "StatusEnzin",
            audience: _configuration["Jwt:Audience"] ?? "StatusEnzinApp",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private void SetAuthCookie(string token)
    {
        Response.Cookies.Append("statusenzin_jwt", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(7)
        });
    }
}
