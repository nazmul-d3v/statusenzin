using StatusEnzin.Api.DTOs;
using Stripe;
using Stripe.BillingPortal;
using StripeSubscription = Stripe.Subscription;

namespace StatusEnzin.Api.Services;

public record SubscriptionPaymentResult(
    bool Success,
    string Message,
    string TransactionId,
    string PlanType,
    string BillingCycle,
    decimal AmountPaid,
    string StripeCustomerId,
    string StripeSubscriptionId,
    string StripePriceId,
    DateTime? CurrentPeriodEnd
);

public record PriceInfo(string Plan, string BillingCycle, string PriceId, decimal Amount);

public interface IStripeService
{
    Task<SubscriptionPaymentResult> CreateSubscriptionAsync(
        string tenantId, ProcessPaymentRequest req, string priceId, string? couponId, string? existingCustomerId);
    Task<SubscriptionPaymentResult> UpgradeSubscriptionAsync(
        string tenantId, ProcessPaymentRequest req, string priceId, string? couponId, string customerId, string subscriptionId);
    Task<StripeSubscription?> GetSubscriptionAsync(string subscriptionId);
    Task SchedulePlanChangeAsync(string subscriptionId, string priceId);
    Task CancelAtPeriodEndAsync(string subscriptionId);
    Task<string> CreateBillingPortalSessionAsync(string customerId, string returnUrl);
    Task<List<PriceInfo>> GetPricesAsync();
    Event ConstructWebhookEvent(string json, string stripeSignature);
}

public class StripeService : IStripeService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<StripeService> _logger;

    private string SecretKey =>
        _configuration["STRIPE_SECRET_KEY"] ?? _configuration["Stripe:SecretKey"] ?? "";

    private bool IsDevMode => string.IsNullOrWhiteSpace(SecretKey) || SecretKey == "YOUR_STRIPE_SECRET_KEY";

    public StripeService(IConfiguration configuration, ILogger<StripeService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        StripeConfiguration.ApiKey = SecretKey;
    }

    public async Task<SubscriptionPaymentResult> CreateSubscriptionAsync(
        string tenantId, ProcessPaymentRequest req, string priceId, string? couponId, string? existingCustomerId)
    {
        if (IsDevMode)
        {
            _logger.LogInformation("[DEV STRIPE] Mock subscription created for {Email}, Plan={Plan}, Cycle={Cycle}",
                req.Email, req.PlanType, req.BillingCycle);
            return MockResult(req, priceId, existingCustomerId);
        }

        try
        {
            var customer = await GetOrCreateCustomerAsync(req, existingCustomerId);

            var subscription = await new SubscriptionService().CreateAsync(new SubscriptionCreateOptions
            {
                Customer = customer.Id,
                Items = new List<SubscriptionItemOptions>
                {
                    new() { Price = priceId, Quantity = 1 }
                },
                Coupon = couponId,
                PaymentBehavior = "default_incomplete",
                PaymentSettings = new SubscriptionPaymentSettingsOptions
                {
                    SaveDefaultPaymentMethod = "on_subscription"
                },
                Metadata = new Dictionary<string, string>
                {
                    { "tenant_id", tenantId },
                    { "plan_type", req.PlanType },
                    { "billing_cycle", req.BillingCycle }
                }
            });

            var amountPaid = await PayLatestInvoiceAsync(subscription, req.PaymentMethodId);
            var refreshed = await new SubscriptionService().GetAsync(subscription.Id);
            return BuildResult(refreshed, amountPaid, req.PlanType, req.BillingCycle);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe subscription creation failed");
            return new SubscriptionPaymentResult(false,
                ex.StripeError?.Message ?? "Payment authorization failed. Please verify card details.",
                "", req.PlanType, req.BillingCycle, 0m, "", "", "", null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Stripe subscription creation failed");
            return new SubscriptionPaymentResult(false,
                "Payment could not be completed. Please verify your card details and try again.",
                "", req.PlanType, req.BillingCycle, 0m, "", "", "", null);
        }
    }

    public async Task<SubscriptionPaymentResult> UpgradeSubscriptionAsync(
        string tenantId, ProcessPaymentRequest req, string priceId, string? couponId, string customerId, string subscriptionId)
    {
        if (IsDevMode)
        {
            _logger.LogInformation("[DEV STRIPE] Mock subscription upgraded for {Email}, Plan={Plan}, Cycle={Cycle}",
                req.Email, req.PlanType, req.BillingCycle);
            return MockResult(req, priceId, customerId);
        }

        try
        {
            var customer = await GetOrCreateCustomerAsync(req, customerId);

            var subService = new SubscriptionService();
            var existing = await subService.GetAsync(subscriptionId);

            if (existing is null || existing.Status is "incomplete" or "incomplete_expired" or "canceled")
            {
                // Stale or dead subscription — tear it down and start fresh.
                try { if (existing is not null) await subService.CancelAsync(existing.Id); }
                catch (StripeException) { }
                return await CreateSubscriptionAsync(tenantId, req, priceId, couponId, customer.Id);
            }

            var itemId = existing.Items.Data.FirstOrDefault()?.Id;
            if (string.IsNullOrWhiteSpace(itemId))
            {
                return await CreateSubscriptionAsync(tenantId, req, priceId, couponId, customer.Id);
            }

            var updated = await subService.UpdateAsync(subscriptionId, new SubscriptionUpdateOptions
            {
                Items = new List<SubscriptionItemOptions>
                {
                    new() { Id = itemId, Price = priceId }
                },
                ProrationBehavior = "create_prorations",
                Coupon = couponId,
                Metadata = new Dictionary<string, string>
                {
                    { "plan_type", req.PlanType },
                    { "billing_cycle", req.BillingCycle }
                }
            });

            // Charge the pending proration difference immediately (billing cycle resets on upgrade).
            var invoiceService = new InvoiceService();
            var prorationInvoice = await invoiceService.CreateAsync(new InvoiceCreateOptions
            {
                Customer = customer.Id,
                Subscription = subscriptionId,
                AutoAdvance = true
            });

            if (prorationInvoice.Status == "open")
            {
                prorationInvoice = await invoiceService.PayAsync(prorationInvoice.Id,
                    new InvoicePayOptions { PaymentMethod = req.PaymentMethodId });
            }

            if (prorationInvoice.Status != "paid")
            {
                throw new InvalidOperationException("Upgrade payment was not completed.");
            }

            var amountPaid = prorationInvoice.AmountPaid / 100m;
            var refreshed = await subService.GetAsync(subscriptionId);
            return BuildResult(refreshed, amountPaid, req.PlanType, req.BillingCycle);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe subscription upgrade failed");
            return new SubscriptionPaymentResult(false,
                ex.StripeError?.Message ?? "Payment authorization failed. Please verify card details.",
                "", req.PlanType, req.BillingCycle, 0m, "", "", "", null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Stripe subscription upgrade failed");
            return new SubscriptionPaymentResult(false,
                "Payment could not be completed. Please verify your card details and try again.",
                "", req.PlanType, req.BillingCycle, 0m, "", "", "", null);
        }
    }

    public async Task<StripeSubscription?> GetSubscriptionAsync(string subscriptionId)
    {
        if (IsDevMode || string.IsNullOrWhiteSpace(subscriptionId)) return null;
        return await new SubscriptionService().GetAsync(subscriptionId);
    }

    // Downgrade to a paid tier: switch the price, keep the billing cycle, no charge now.
    public async Task SchedulePlanChangeAsync(string subscriptionId, string priceId)
    {
        if (IsDevMode) return;

        var existing = await new SubscriptionService().GetAsync(subscriptionId);
        var itemId = existing.Items.Data.FirstOrDefault()?.Id;
        if (string.IsNullOrWhiteSpace(itemId)) return;

        await new SubscriptionService().UpdateAsync(subscriptionId, new SubscriptionUpdateOptions
        {
            Items = new List<SubscriptionItemOptions>
            {
                new() { Id = itemId, Price = priceId }
            },
            ProrationBehavior = "none",
            BillingCycleAnchor = Stripe.SubscriptionBillingCycleAnchor.Unchanged,
            CancelAtPeriodEnd = false
        });
    }

    // Downgrade to Starter: let the paid subscription end naturally at period end.
    public async Task CancelAtPeriodEndAsync(string subscriptionId)
    {
        if (IsDevMode) return;

        await new SubscriptionService().UpdateAsync(subscriptionId, new SubscriptionUpdateOptions
        {
            CancelAtPeriodEnd = true
        });
    }

    public async Task<string> CreateBillingPortalSessionAsync(string customerId, string returnUrl)
    {
        if (IsDevMode)
        {
            _logger.LogInformation("[DEV STRIPE] Mock billing portal session for {CustomerId}", customerId);
            return returnUrl;
        }

        var session = await new SessionService().CreateAsync(new SessionCreateOptions
        {
            Customer = customerId,
            ReturnUrl = returnUrl
        });
        return session.Url;
    }

    public async Task<List<PriceInfo>> GetPricesAsync()
    {
        var priceIds = new (string Plan, string BillingCycle, string Id)[]
        {
            ("Pro", "monthly", _configuration["STRIPE_PRO_MONTHLY_PRICE_ID"] ?? "price_pro_test"),
            ("Pro", "annual", _configuration["STRIPE_PRO_ANNUAL_PRICE_ID"] ?? _configuration["STRIPE_PRO_MONTHLY_PRICE_ID"] ?? "price_pro_test"),
            ("Business", "monthly", _configuration["STRIPE_BUSINESS_MONTHLY_PRICE_ID"] ?? "price_business_test"),
            ("Business", "annual", _configuration["STRIPE_BUSINESS_ANNUAL_PRICE_ID"] ?? _configuration["STRIPE_BUSINESS_MONTHLY_PRICE_ID"] ?? "price_business_test")
        };

        var prices = new List<PriceInfo>();

        foreach (var (plan, cycle, id) in priceIds)
        {
            if (IsDevMode)
            {
                prices.Add(new PriceInfo(plan, cycle, id, PlanPricing.GetPrice(plan, cycle)));
                continue;
            }

            try
            {
                var price = await new PriceService().GetAsync(id);
                prices.Add(new PriceInfo(plan, cycle, price.Id, (price.UnitAmount ?? 0) / 100m));
            }
            catch (StripeException ex)
            {
                _logger.LogWarning(ex, "Failed to load Stripe price {PriceId}", id);
                prices.Add(new PriceInfo(plan, cycle, id, PlanPricing.GetPrice(plan, cycle)));
            }
        }

        return prices;
    }

    public Event ConstructWebhookEvent(string json, string stripeSignature)
    {
        var webhookSecret = _configuration["STRIPE_WEBHOOK_SECRET"] ?? _configuration["Stripe:WebhookSecret"];
        if (string.IsNullOrWhiteSpace(webhookSecret))
        {
            return EventUtility.ParseEvent(json);
        }
        return EventUtility.ConstructEvent(json, stripeSignature, webhookSecret);
    }

    private async Task<Customer> GetOrCreateCustomerAsync(ProcessPaymentRequest req, string? existingCustomerId)
    {
        if (!string.IsNullOrWhiteSpace(existingCustomerId))
        {
            try
            {
                await new PaymentMethodService().AttachAsync(req.PaymentMethodId,
                    new PaymentMethodAttachOptions { Customer = existingCustomerId });

                return await new CustomerService().UpdateAsync(existingCustomerId, new CustomerUpdateOptions
                {
                    InvoiceSettings = new CustomerInvoiceSettingsOptions
                    {
                        DefaultPaymentMethod = req.PaymentMethodId
                    }
                });
            }
            catch (StripeException)
            {
                // Stale customer reference — fall through and create a fresh customer.
            }
        }

        return await new CustomerService().CreateAsync(new CustomerCreateOptions
        {
            Email = req.Email,
            Name = req.FullName,
            PaymentMethod = req.PaymentMethodId,
            InvoiceSettings = new CustomerInvoiceSettingsOptions
            {
                DefaultPaymentMethod = req.PaymentMethodId
            },
            Address = new AddressOptions
            {
                Line1 = req.Address,
                City = req.City,
                State = req.State,
                PostalCode = req.Zip,
                Country = req.Country
            }
        });
    }

    private async Task<decimal> PayLatestInvoiceAsync(StripeSubscription subscription, string paymentMethodId)
    {
        var invoiceService = new InvoiceService();
        var invoice = await invoiceService.GetAsync(subscription.LatestInvoiceId);

        if (invoice.Status == "open")
        {
            invoice = await invoiceService.PayAsync(invoice.Id, new InvoicePayOptions
            {
                PaymentMethod = paymentMethodId
            });
        }

        if (invoice.Status != "paid")
        {
            throw new InvalidOperationException("Subscription payment was not completed.");
        }

        return invoice.AmountPaid / 100m;
    }

    private static SubscriptionPaymentResult BuildResult(
        StripeSubscription subscription, decimal amountPaid, string plan, string billingCycle)
    {
        var priceId = subscription.Items?.Data?.FirstOrDefault()?.Price?.Id ?? "";

        return new SubscriptionPaymentResult(
            Success: true,
            Message: $"Payment of ${amountPaid:F2} processed. Your {plan} plan is active and will renew automatically.",
            TransactionId: subscription.LatestInvoiceId ?? subscription.Id,
            PlanType: plan,
            BillingCycle: billingCycle,
            AmountPaid: amountPaid,
            StripeCustomerId: subscription.CustomerId,
            StripeSubscriptionId: subscription.Id,
            StripePriceId: priceId,
            CurrentPeriodEnd: subscription.CurrentPeriodEnd
        );
    }

    private SubscriptionPaymentResult MockResult(ProcessPaymentRequest req, string priceId, string? existingCustomerId)
    {
        var amount = (decimal)PlanPricing.GetPrice(req.PlanType, req.BillingCycle);
        var customerId = existingCustomerId ?? ("cust_mock_" + Guid.NewGuid().ToString("N")[..10]);
        var subscriptionId = "sub_mock_" + Guid.NewGuid().ToString("N")[..10];
        var periodEnd = DateTime.UtcNow.AddDays(
            req.BillingCycle.Equals("annual", StringComparison.OrdinalIgnoreCase) ? 365 : 30);

        return new SubscriptionPaymentResult(
            Success: true,
            Message: $"Payment of ${amount:F2} processed via StatusEnzin Secure Billing. Your {req.PlanType} plan is active.",
            TransactionId: subscriptionId,
            PlanType: req.PlanType,
            BillingCycle: req.BillingCycle,
            AmountPaid: amount,
            StripeCustomerId: customerId,
            StripeSubscriptionId: subscriptionId,
            StripePriceId: priceId,
            CurrentPeriodEnd: periodEnd
        );
    }
}
