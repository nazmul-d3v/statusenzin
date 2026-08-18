using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StatusEnzin.Api.Data;
using StatusEnzin.Api.DTOs;
using StatusEnzin.Api.Models;
using StatusEnzin.Api.Services;

namespace StatusEnzin.Api.Controllers;

[ApiController]
[Route("api/subscribers")]
public class SubscribersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public SubscribersController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Subscribe([FromBody] SubscribeRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || req.StatusPageId == Guid.Empty)
        {
            return BadRequest(new { message = "Email and StatusPageId are required." });
        }

        var page = await _db.StatusPages.IgnoreQueryFilters().FirstOrDefaultAsync(sp => sp.Id == req.StatusPageId);
        if (page == null) return NotFound(new { message = "Status page not found." });

        var baseUrl = (_config["API_URL"] ?? "http://localhost:5001").TrimEnd('/');
        var frontendUrl = (_config["FRONTEND_URL"] ?? "http://localhost:3000").TrimEnd('/');

        var existing = await _db.Subscribers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.StatusPageId == req.StatusPageId && s.Email == req.Email);

        if (existing != null)
        {
            if (existing.IsConfirmed)
            {
                return Ok(new { message = "You are already subscribed to this status page." });
            }

            // Unconfirmed subscriber attempting to subscribe again: re-send confirmation email
            var reToken = existing.ConfirmationToken ?? Guid.NewGuid().ToString("N");
            existing.ConfirmationToken = reToken;

            _db.EmailJobs.Add(BuildConfirmationJob(page, reToken, baseUrl, frontendUrl, req.Email));

            await _db.SaveChangesAsync();
            return Ok(new { message = "Subscription request received. Confirmation email re-sent. Please check your email." });
        }

        var token = Guid.NewGuid().ToString("N");
        var subscriber = new Subscriber
        {
            StatusPageId = req.StatusPageId,
            Email = req.Email,
            IsConfirmed = false,
            ConfirmationToken = token
        };

        _db.Subscribers.Add(subscriber);

        _db.EmailJobs.Add(BuildConfirmationJob(page, token, baseUrl, frontendUrl, req.Email));

        await _db.SaveChangesAsync();

        return Ok(new { message = "Subscription request received. Please check your email to confirm." });
    }

    [AllowAnonymous]
    [HttpGet("confirm")]
    public async Task<IActionResult> Confirm([FromQuery] string token)
    {
        var sub = await _db.Subscribers.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.ConfirmationToken == token);
        if (sub == null) return BadRequest(new { message = "Invalid confirmation token." });

        sub.IsConfirmed = true;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Subscription confirmed successfully! You will now receive status updates." });
    }

    private static EmailJob BuildConfirmationJob(StatusPage page, string token, string apiBaseUrl, string frontendUrl, string email)
    {
        var variables = new Dictionary<string, string>
        {
            ["LOGO_URL"] = $"{frontendUrl}/logo.png",
            ["STATUS_PAGE_NAME"] = page.Name,
            ["CONFIRM_LINK"] = $"{apiBaseUrl}/api/subscribers/confirm?token={token}",
            ["APP_URL"] = frontendUrl,
            ["APP_NAME"] = EmailTemplates.AppName
        };

        return new EmailJob
        {
            TenantId = page.TenantId,
            RecipientEmail = email,
            Subject = $"Confirm your subscription to {page.Name} status updates",
            TemplateId = EmailTemplates.SubscribeConfirmation,
            TemplateDataJson = System.Text.Json.JsonSerializer.Serialize(variables)
        };
    }
}
