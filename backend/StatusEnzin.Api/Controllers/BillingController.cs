using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StatusEnzin.Api.Data;
using StatusEnzin.Api.DTOs;
using StatusEnzin.Api.Models;
using StatusEnzin.Api.Services;
using StripeInvoice = Stripe.Invoice;
using StripeSubscription = Stripe.Subscription;

namespace StatusEnzin.Api.Controllers;

[ApiController]
[Route("api/billing")]
public class BillingController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenantProvider;
    private readonly IStripeService _stripeService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<BillingController> _logger;

    public BillingController(
        AppDbContext db,
        ITenantProvider tenantProvider,
        IStripeService stripeService,
        IConfiguration configuration,
        ILogger<BillingController> logger)
    {
        _db = db;
        _tenantProvider = tenantProvider;
        _stripeService = stripeService;
        _configuration = configuration;
        _logger = logger;
    }

    [Authorize]
    [HttpGet("subscription")]
    public async Task<IActionResult> GetSubscription()
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();
        if (tenantId == null) return Unauthorized();

        var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == tenantId.Value);
        var sub = await _db.Subscriptions.FirstOrDefaultAsync(s => s.TenantId == tenantId.Value);

        var monitorCount = await _db.Monitors.CountAsync();
        var statusPageCount = await _db.StatusPages.CountAsync();

        var plan = tenant?.PlanType ?? "Starter";
        int monitorLimit = plan switch { "Business" => 100, "Pro" => 25, _ => 5 };
        int statusPageLimit = plan switch { "Business" => 10, "Pro" => 3, _ => 1 };

        return Ok(new
        {
            PlanType = plan,
            BillingCycle = sub?.BillingCycle ?? "monthly",
            Status = sub?.Status ?? "active",
            Usage = new
            {
                MonitorsUsed = monitorCount,
                MonitorsLimit = monitorLimit,
                StatusPagesUsed = statusPageCount,
                StatusPagesLimit = statusPageLimit
            },
            CurrentPeriodEnd = sub?.CurrentPeriodEnd,
            PendingPlanType = sub?.PendingPlanType,
            PendingDowngradeAt = sub?.PendingPlanType != null ? sub?.CurrentPeriodEnd : null
        });
    }

    [Authorize]
    [HttpGet("prices")]
    public async Task<IActionResult> GetPrices()
    {
        var prices = await _stripeService.GetPricesAsync();
        return Ok(new { prices });
    }

    [Authorize]
    [HttpPost("process-payment")]
    public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentRequest req)
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();
        if (tenantId == null) return Unauthorized();

        var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == tenantId.Value);
        if (tenant == null) return NotFound("Tenant context not found.");

        var currentPlan = tenant.PlanType;
        var targetPlan = req.PlanType;

        // Downgrades (or same plan) must go through /billing/downgrade — never charged here.
        if (PlanPricing.GetPlanRank(targetPlan) <= PlanPricing.GetPlanRank(currentPlan))
        {
            return BadRequest(new ProcessPaymentResponse(
                false,
                "",
                targetPlan,
                "failed",
                currentPlan == targetPlan
                    ? $"You are already on the {currentPlan} plan."
                    : "Downgrades take effect at the end of your current billing period. Use the billing dashboard to schedule one.",
                0m,
                req.BillingCycle
            ));
        }

        if (string.IsNullOrWhiteSpace(req.PaymentMethodId))
        {
            return BadRequest(new ProcessPaymentResponse(
                false, "", targetPlan, "failed",
                "Payment method is required. Please enter valid card details.", 0m, req.BillingCycle
            ));
        }

        if (string.IsNullOrWhiteSpace(req.Email) || !req.Email.Contains('@'))
        {
            return BadRequest(new ProcessPaymentResponse(
                false, "", targetPlan, "failed",
                "A valid email address is required.", 0m, req.BillingCycle
            ));
        }

        var couponId = PlanPricing.GetCouponId(_configuration, req.CouponCode);
        if (!string.IsNullOrWhiteSpace(req.CouponCode) && couponId == null)
        {
            return BadRequest(new ProcessPaymentResponse(
                false, "", targetPlan, "failed",
                "Invalid coupon code.", 0m, req.BillingCycle
            ));
        }

        var priceId = PlanPricing.GetStripePriceId(_configuration, targetPlan, req.BillingCycle);
        if (string.IsNullOrWhiteSpace(priceId))
        {
            return BadRequest(new ProcessPaymentResponse(
                false, "", targetPlan, "failed",
                "The selected plan is not available for purchase.", 0m, req.BillingCycle
            ));
        }

        var sub = await _db.Subscriptions.FirstOrDefaultAsync(s => s.TenantId == tenantId.Value);

        // Real Stripe subscription (with recurring billing) via a payment method collected
        // on our custom checkout page. Existing active subscriptions are upgraded in place
        // and the prorated difference is charged immediately.
        SubscriptionPaymentResult result;
        if (sub != null && !string.IsNullOrWhiteSpace(sub.StripeSubscriptionId))
        {
            result = await _stripeService.UpgradeSubscriptionAsync(
                tenantId.Value.ToString(), req, priceId, couponId, sub.StripeCustomerId, sub.StripeSubscriptionId);
        }
        else
        {
            result = await _stripeService.CreateSubscriptionAsync(
                tenantId.Value.ToString(), req, priceId, couponId, sub?.StripeCustomerId);
        }

        if (!result.Success)
        {
            return BadRequest(new ProcessPaymentResponse(
                false, "", targetPlan, "failed", result.Message, 0m, req.BillingCycle
            ));
        }

        // Upgrade is effective immediately; the Stripe subscription renews automatically.
        tenant.PlanType = targetPlan;

        var nextPeriodEnd = result.CurrentPeriodEnd ?? NextPeriodEnd(req.BillingCycle);

        if (sub == null)
        {
            sub = new Subscription
            {
                TenantId = tenantId.Value,
                PlanType = targetPlan,
                BillingCycle = req.BillingCycle,
                Status = "active",
                StripeCustomerId = result.StripeCustomerId,
                StripeSubscriptionId = result.StripeSubscriptionId,
                StripePriceId = result.StripePriceId,
                CurrentPeriodEnd = nextPeriodEnd
            };
            _db.Subscriptions.Add(sub);
        }
        else
        {
            sub.PlanType = targetPlan;
            sub.BillingCycle = req.BillingCycle;
            sub.Status = "active";
            sub.PendingPlanType = null;
            sub.StripeCustomerId = result.StripeCustomerId;
            sub.StripeSubscriptionId = result.StripeSubscriptionId;
            sub.StripePriceId = result.StripePriceId;
            sub.CurrentPeriodEnd = nextPeriodEnd;
        }

        // The receipt always goes to the account owner (the authenticated user),
        // never to a client-supplied checkout email. req.Email is still used for the
        // Stripe customer/billing email, but must not decide who receives the receipt.
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var owner = !string.IsNullOrWhiteSpace(userId)
            ? await _db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId)
            : null;
        owner ??= await _db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.TenantId == tenantId.Value);
        var ownerEmail = owner?.Email ?? req.Email;
        var ownerName = owner != null && !string.IsNullOrWhiteSpace(owner.FullName)
            ? owner.FullName
            : ownerEmail.Split('@')[0];

        var frontendUrl = (_configuration["FRONTEND_URL"] ?? "http://localhost:3000").TrimEnd('/');
        _db.EmailJobs.Add(new EmailJob
        {
            TenantId = tenantId.Value,
            RecipientEmail = ownerEmail,
            Subject = $"Your StatusEnzin {targetPlan} upgrade is confirmed",
            TemplateId = EmailTemplates.PaymentReceipt,
            TemplateDataJson = System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, string>
            {
                ["LOGO_URL"] = $"{frontendUrl}/logo.png",
                ["NAME"] = ownerName,
                ["PLAN_NAME"] = targetPlan,
                ["BILLING_CYCLE"] = req.BillingCycle,
                ["AMOUNT_PAID"] = $"${result.AmountPaid.ToString("N2")}",
                ["TRANSACTION_ID"] = result.TransactionId,
                ["RENEWAL_DATE"] = nextPeriodEnd.ToUniversalTime().ToString("MMM d, yyyy"),
                ["BILLING_URL"] = $"{frontendUrl}/dashboard/billing",
                ["APP_URL"] = frontendUrl,
                ["APP_NAME"] = EmailTemplates.AppName
            })
        });

        await _db.SaveChangesAsync();

        return Ok(new ProcessPaymentResponse(
            true,
            result.TransactionId,
            targetPlan,
            "active",
            result.Message,
            result.AmountPaid,
            req.BillingCycle
        ));
    }

    [Authorize]
    [HttpPost("downgrade")]
    public async Task<IActionResult> Downgrade([FromBody] DowngradeRequest req)
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();
        if (tenantId == null) return Unauthorized();

        var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == tenantId.Value);
        if (tenant == null) return NotFound(new { message = "Tenant context not found." });

        var currentPlan = tenant.PlanType;
        var targetPlan = req.PlanType;

        if (PlanPricing.GetPlanRank(targetPlan) >= PlanPricing.GetPlanRank(currentPlan))
        {
            return BadRequest(new { message = "This endpoint only schedules downgrades to a lower tier." });
        }

        var sub = await _db.Subscriptions.FirstOrDefaultAsync(s => s.TenantId == tenantId.Value);
        if (sub == null)
        {
            sub = new Subscription
            {
                TenantId = tenantId.Value,
                PlanType = currentPlan,
                Status = "active",
                PendingPlanType = targetPlan,
                CurrentPeriodEnd = DateTime.UtcNow.AddDays(30)
            };
            _db.Subscriptions.Add(sub);
        }
        else
        {
            // Paid access is maintained until the end of the current billing period — no refund, no charge.
            sub.PendingPlanType = targetPlan;
        }

        // Mirror the downgrade in Stripe so the recurring subscription follows the local schedule.
        if (!string.IsNullOrWhiteSpace(sub.StripeSubscriptionId))
        {
            try
            {
                if (targetPlan == "Starter")
                {
                    await _stripeService.CancelAtPeriodEndAsync(sub.StripeSubscriptionId);
                }
                else
                {
                    var newPriceId = PlanPricing.GetStripePriceId(_configuration, targetPlan, sub.BillingCycle ?? "monthly");
                    if (!string.IsNullOrWhiteSpace(newPriceId))
                    {
                        await _stripeService.SchedulePlanChangeAsync(sub.StripeSubscriptionId, newPriceId);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to schedule Stripe downgrade for tenant {TenantId}", tenantId.Value);
            }
        }

        var owner = await _db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.TenantId == tenantId.Value);
        if (owner?.Email != null)
        {
            var frontendUrl = (_configuration["FRONTEND_URL"] ?? "http://localhost:3000").TrimEnd('/');
            var effectiveDate = sub.CurrentPeriodEnd?.ToUniversalTime().ToString("MMM d, yyyy") ?? "End of billing period";

            _db.EmailJobs.Add(new EmailJob
            {
                TenantId = tenantId.Value,
                RecipientEmail = owner.Email,
                Subject = $"Your StatusEnzin downgrade to {targetPlan} has been scheduled",
                TemplateId = EmailTemplates.Downgrade,
                TemplateDataJson = System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, string>
                {
                    ["LOGO_URL"] = $"{frontendUrl}/logo.png",
                    ["NAME"] = string.IsNullOrWhiteSpace(owner.FullName) ? owner.Email : owner.FullName,
                    ["HEADLINE"] = "Downgrade scheduled",
                    ["BODY_TEXT"] = $"Your downgrade to {targetPlan} has been scheduled. Your {currentPlan} plan stays active until {effectiveDate} — no charge, no refund.",
                    ["CURRENT_PLAN"] = currentPlan,
                    ["TARGET_PLAN"] = targetPlan,
                    ["EFFECTIVE_DATE"] = effectiveDate,
                    ["BILLING_URL"] = $"{frontendUrl}/dashboard/billing",
                    ["APP_URL"] = frontendUrl,
                    ["APP_NAME"] = EmailTemplates.AppName
                })
            });
        }

        await _db.SaveChangesAsync();

        var effectiveAt = sub.CurrentPeriodEnd;
        return Ok(new
        {
            PlanType = currentPlan,
            PendingPlanType = targetPlan,
            EffectiveAt = effectiveAt,
            Message = $"Downgrade to {targetPlan} scheduled. Your {currentPlan} plan stays active until {effectiveAt?.ToUniversalTime():O} — no charge, no refund."
        });
    }

    [Authorize]
    [HttpPost("portal")]
    public async Task<IActionResult> CreatePortalSession()
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();
        if (tenantId == null) return Unauthorized();

        var sub = await _db.Subscriptions.FirstOrDefaultAsync(s => s.TenantId == tenantId.Value);
        if (sub == null || string.IsNullOrWhiteSpace(sub.StripeCustomerId))
        {
            return BadRequest(new { message = "You don't have an active billing account yet. Subscribe first to manage billing." });
        }

        var frontendUrl = (_configuration["FRONTEND_URL"] ?? "http://localhost:3000").TrimEnd('/');
        var url = await _stripeService.CreateBillingPortalSessionAsync(sub.StripeCustomerId, $"{frontendUrl}/dashboard/billing");

        return Ok(new { url });
    }

    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        try
        {
            var stripeEvent = _stripeService.ConstructWebhookEvent(json, Request.Headers["Stripe-Signature"].ToString() ?? "");

            switch (stripeEvent.Type)
            {
                case "customer.subscription.created":
                case "customer.subscription.updated":
                    if (stripeEvent.Data.Object is StripeSubscription stripeSub)
                    {
                        await SyncSubscriptionAsync(stripeSub);
                    }
                    break;

                case "customer.subscription.deleted":
                    if (stripeEvent.Data.Object is StripeSubscription deletedSub)
                    {
                        await CancelSubscriptionAsync(deletedSub);
                    }
                    break;

                case "invoice.payment_succeeded":
                    if (stripeEvent.Data.Object is StripeInvoice invoice && !string.IsNullOrWhiteSpace(invoice.SubscriptionId))
                    {
                        var renewed = await _stripeService.GetSubscriptionAsync(invoice.SubscriptionId);
                        if (renewed != null)
                        {
                            await SyncSubscriptionAsync(renewed);
                        }
                    }
                    break;

                case "invoice.payment_failed":
                    if (stripeEvent.Data.Object is StripeInvoice failedInvoice)
                    {
                        await MarkPastDueAsync(failedInvoice);
                    }
                    break;
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Stripe webhook processing failed");
            return BadRequest(new { error = ex.Message });
        }
    }

    private async Task SyncSubscriptionAsync(StripeSubscription stripeSub)
    {
        if (stripeSub == null) return;

        var tenantId = await ResolveTenantIdAsync(stripeSub);
        if (tenantId == null) return;

        var sub = await _db.Subscriptions.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.TenantId == tenantId.Value);
        if (sub == null)
        {
            sub = new Subscription { TenantId = tenantId.Value };
            _db.Subscriptions.Add(sub);
        }

        var (plan, cycle) = PlanPricing.GetPlanFromPriceId(
            _configuration, stripeSub.Items?.Data?.FirstOrDefault()?.Price?.Id ?? "");

        sub.StripeSubscriptionId = stripeSub.Id;
        sub.StripeCustomerId = stripeSub.CustomerId;
        sub.StripePriceId = stripeSub.Items?.Data?.FirstOrDefault()?.Price?.Id ?? "";
        sub.BillingCycle = string.IsNullOrWhiteSpace(cycle) ? "monthly" : cycle;
        sub.CurrentPeriodEnd = stripeSub.CurrentPeriodEnd;
        sub.PendingPlanType = null;

        if (plan != "Starter")
        {
            sub.PlanType = plan;
        }

        sub.Status = stripeSub.Status switch
        {
            "active" => "active",
            "trialing" => "active",
            "past_due" => "past_due",
            "unpaid" => "past_due",
            _ => "canceled"
        };

        if ((stripeSub.Status == "active" || stripeSub.Status == "trialing") && plan != "Starter")
        {
            var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == tenantId.Value);
            if (tenant != null)
            {
                tenant.PlanType = plan;
            }
        }

        await _db.SaveChangesAsync();
    }

    private async Task CancelSubscriptionAsync(StripeSubscription stripeSub)
    {
        if (stripeSub == null) return;

        var tenantId = await ResolveTenantIdAsync(stripeSub);
        if (tenantId == null) return;

        var sub = await _db.Subscriptions.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.TenantId == tenantId.Value);
        if (sub == null) return;

        // The paid period has ended — revert the tenant to Starter.
        var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == tenantId.Value);
        if (tenant != null)
        {
            tenant.PlanType = "Starter";
        }

        sub.PlanType = "Starter";
        sub.Status = "canceled";
        sub.PendingPlanType = null;
        sub.CurrentPeriodEnd = null;
        sub.StripeSubscriptionId = string.Empty;
        sub.StripePriceId = string.Empty;

        await _db.SaveChangesAsync();
    }

    private async Task MarkPastDueAsync(StripeInvoice invoice)
    {
        if (invoice == null || string.IsNullOrWhiteSpace(invoice.SubscriptionId)) return;

        var sub = await _db.Subscriptions.IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.StripeSubscriptionId == invoice.SubscriptionId);
        if (sub == null) return;

        sub.Status = "past_due";
        await _db.SaveChangesAsync();
    }

    private async Task<Guid?> ResolveTenantIdAsync(StripeSubscription stripeSub)
    {
        if (stripeSub.Metadata.TryGetValue("tenant_id", out var metadataTenantId) &&
            Guid.TryParse(metadataTenantId, out var tenantId))
        {
            return tenantId;
        }

        // Fallback: match by Stripe customer id.
        var sub = await _db.Subscriptions.IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.StripeCustomerId == stripeSub.CustomerId);
        return sub?.TenantId;
    }

    private static DateTime NextPeriodEnd(string billingCycle) =>
        DateTime.UtcNow.AddDays(billingCycle.Equals("annual", StringComparison.OrdinalIgnoreCase) ? 365 : 30);
}
