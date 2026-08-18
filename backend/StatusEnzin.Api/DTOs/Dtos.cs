namespace StatusEnzin.Api.DTOs;

public record SignupRequest(string Email, string Password, string FullName, string CompanyName);
public record LoginRequest(string Email, string Password);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Token, string NewPassword);
public record AuthResponse(string Token, string Email, string FullName, string FirstName, string LastName, Guid TenantId, string TenantName, string PlanType, bool IsPlatformAdmin);
public record UpdateProfileRequest(string FirstName, string LastName, string Email);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record CreateMonitorRequest(string Name, string Url, int CheckIntervalSeconds = 300, int ExpectedStatusCode = 200);
public record UpdateMonitorRequest(string Name, string Url, int CheckIntervalSeconds, int ExpectedStatusCode);

public record CreateStatusPageRequest(string Name, string Slug, string Description, bool IsPublic, List<Guid> ComponentIds);
public record UpdateStatusPageRequest(string Name, string? Slug, string Description, bool IsPublic, List<Guid> ComponentIds);

public record CreateIncidentRequest(Guid StatusPageId, string Title, string Status, string Impact, string Message);
public record UpdateIncidentRequest(string? Title, string Status, string Impact, string Message);
public record AddIncidentUpdateRequest(string Status, string Message);

public record SubscribeRequest(Guid StatusPageId, string Email);
public record CheckoutRequest(string PlanType);
public record DowngradeRequest(string PlanType);

public record ProcessPaymentRequest(
    string PlanType,
    string BillingCycle,
    string FullName,
    string Email,
    string PaymentMethodId,
    string Address,
    string City,
    string State,
    string Zip,
    string Country,
    string? CouponCode
);

public record ProcessPaymentResponse(
    bool Success,
    string TransactionId,
    string PlanType,
    string Status,
    string Message,
    decimal AmountPaid,
    string BillingCycle
);

