namespace StatusEnzin.Api.Services;

public static class EmailTemplates
{
    public const string Welcome = "welcome";
    public const string ResetPassword = "reset-password";
    public const string SubscribeConfirmation = "subscribe-confirmation";
    public const string IncidentUpdate = "incident-update";
    public const string PaymentReceipt = "payment-receipt";
    public const string MonitorDown = "monitor-down";
    public const string MonitorUp = "monitor-up";
    public const string PasswordChanged = "password-changed";
    public const string Downgrade = "downgrade";

    public const string AppName = "StatusEnzin";

    public static (string Color, string Background) StatusColors(string status)
    {
        return (status ?? "").Trim().ToLowerInvariant() switch
        {
            "investigating" => ("#fbbf24", "#2a1f00"),
            "identified" => ("#fb923c", "#2a1605"),
            "monitoring" => ("#60a5fa", "#0c1f3a"),
            "resolved" => ("#30ff87", "#052e1b"),
            "scheduled" or "maintenance" => ("#a78bfa", "#1e1230"),
            _ => ("#a3a3a3", "#171717")
        };
    }

    public static string RenderForDevLog(string templateId, IReadOnlyDictionary<string, string> variables)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "EmailTemplates", $"{templateId}.html");
        if (!File.Exists(path))
        {
            return string.Join(" | ", variables.Select(kv => $"{kv.Key}={kv.Value}"));
        }

        var html = File.ReadAllText(path);
        foreach (var kv in variables)
        {
            html = html.Replace("{{{" + kv.Key + "}}}", System.Net.WebUtility.HtmlEncode(kv.Value ?? ""));
        }

        return html;
    }
}
