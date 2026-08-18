namespace StatusEnzin.Api.Services;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string bodyHtml);
    Task SendTemplatedEmailAsync(string to, string subject, string templateId, IReadOnlyDictionary<string, string> variables);
}

public class ResendEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(IConfiguration configuration, ILogger<ResendEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public Task SendEmailAsync(string to, string subject, string bodyHtml)
    {
        return SendAsync(new
        {
            from = FromEmail,
            to = new[] { to },
            subject,
            html = bodyHtml
        }, to, subject);
    }

    public async Task SendTemplatedEmailAsync(string to, string subject, string templateId, IReadOnlyDictionary<string, string> variables)
    {
        var resolvedTemplateId = _configuration[$"RESEND_TEMPLATE_{templateId.ToUpperInvariant().Replace('-', '_')}"] ?? templateId;

        var apiKey = ApiKey;
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "YOUR_RESEND_API_KEY")
        {
            var body = EmailTemplates.RenderForDevLog(templateId, variables);
            _logger.LogInformation("[DEV EMAIL LOG] To: {To} | Subject: {Subject} | Template: {TemplateId} | Body preview: {Body}",
                to, subject, resolvedTemplateId, body.Length > 150 ? body[..150] + "..." : body);
            return;
        }

        await SendAsync(new
        {
            from = FromEmail,
            to = new[] { to },
            subject,
            template = new
            {
                id = resolvedTemplateId,
                variables
            }
        }, to, subject);
    }

    private async Task SendAsync(object payload, string to, string subject)
    {
        var apiKey = ApiKey;
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "YOUR_RESEND_API_KEY")
        {
            _logger.LogInformation("[DEV EMAIL LOG] To: {To} | Subject: {Subject}", to, subject);
            return;
        }

        try
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            var response = await client.PostAsJsonAsync("https://api.resend.com/emails", payload);
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync();
                _logger.LogError("Resend API failed ({StatusCode}): {Error}", response.StatusCode, errorText);
                throw new InvalidOperationException($"Resend API returned {response.StatusCode}: {errorText}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed sending email via Resend to {To}", to);
            throw;
        }
    }

    private string ApiKey =>
        _configuration["RESEND_API_KEY"] ?? _configuration["Resend:ApiKey"] ?? "";

    private string FromEmail =>
        _configuration["RESEND_FROM_EMAIL"] ?? _configuration["Resend:FromEmail"] ?? "alerts@statusenzin.me";
}
