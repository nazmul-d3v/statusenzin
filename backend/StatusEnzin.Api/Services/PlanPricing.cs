namespace StatusEnzin.Api.Services;

public static class PlanPricing
{
    // Display fallbacks only. The actual charged prices come from Stripe price IDs.
    public static int GetMonthlyPrice(string plan) => plan switch
    {
        "Business" => 49,
        "Pro" => 15,
        _ => 0
    };

    public static int GetAnnualPrice(string plan) => plan switch
    {
        "Business" => 470,
        "Pro" => 144,
        _ => 0
    };

    public static int GetPrice(string plan, string billingCycle) =>
        billingCycle.Equals("annual", StringComparison.OrdinalIgnoreCase)
            ? GetAnnualPrice(plan)
            : GetMonthlyPrice(plan);

    // Higher rank = more expensive plan. Starter=0, Pro=1, Business=2
    public static int GetPlanRank(string plan) => plan switch
    {
        "Business" => 2,
        "Pro" => 1,
        _ => 0
    };

    // Resolves the Stripe Price ID for a plan + billing cycle.
    // Annual price IDs fall back to the monthly ID when not configured.
    public static string GetStripePriceId(IConfiguration config, string plan, string billingCycle)
    {
        var annual = billingCycle.Equals("annual", StringComparison.OrdinalIgnoreCase);
        return plan switch
        {
            "Business" => annual
                ? (config["STRIPE_BUSINESS_ANNUAL_PRICE_ID"] ?? config["STRIPE_BUSINESS_MONTHLY_PRICE_ID"] ?? "price_business_test")
                : (config["STRIPE_BUSINESS_MONTHLY_PRICE_ID"] ?? "price_business_test"),
            "Pro" => annual
                ? (config["STRIPE_PRO_ANNUAL_PRICE_ID"] ?? config["STRIPE_PRO_MONTHLY_PRICE_ID"] ?? "price_pro_test")
                : (config["STRIPE_PRO_MONTHLY_PRICE_ID"] ?? "price_pro_test"),
            _ => ""
        };
    }

    // Reverse lookup used by the webhook to map a Stripe Price ID back to plan + cycle.
    public static (string Plan, string BillingCycle) GetPlanFromPriceId(IConfiguration config, string priceId)
    {
        if (string.IsNullOrWhiteSpace(priceId)) return ("Starter", "monthly");

        if (config["STRIPE_PRO_MONTHLY_PRICE_ID"] == priceId) return ("Pro", "monthly");
        if (config["STRIPE_BUSINESS_MONTHLY_PRICE_ID"] == priceId) return ("Business", "monthly");
        if (config["STRIPE_PRO_ANNUAL_PRICE_ID"] == priceId) return ("Pro", "annual");
        if (config["STRIPE_BUSINESS_ANNUAL_PRICE_ID"] == priceId) return ("Business", "annual");

        return ("Starter", "monthly");
    }

    // Maps a user-facing coupon code to a Stripe coupon ID (configured in .env).
    // Unknown codes return null so the caller can reject them.
    public static string? GetCouponId(IConfiguration config, string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;

        var c = code.Trim().ToUpperInvariant();
        return c switch
        {
            "SAVE20" or "WELCOME20" => config["STRIPE_COUPON_SAVE20"] ?? c,
            "PROMO10" => config["STRIPE_COUPON_PROMO10"] ?? c,
            "HALFPRICE" => config["STRIPE_COUPON_HALFPRICE"] ?? c,
            _ => null
        };
    }
}
