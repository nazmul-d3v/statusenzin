using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StatusEnzin.Api.Data;
using StatusEnzin.Api.Models;
using StatusEnzin.Api.Services;

// 0. Load .env file if present
var envFilePath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envFilePath))
{
    foreach (var line in File.ReadAllLines(envFilePath))
    {
        var trimmed = line.Trim();
        if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("#")) continue;
        var parts = trimmed.Split('=', 2);
        if (parts.Length == 2)
        {
            var key = parts[0].Trim();
            var val = parts[1].Trim();
            if (!string.IsNullOrEmpty(key))
            {
                Environment.SetEnvironmentVariable(key, val);
            }
        }
    }
}

var builder = WebApplication.CreateBuilder(args);

// Bind to 0.0.0.0:<PORT> so the API is reachable inside a container.
// API_URL is separate and holds the public URL (used in email links etc.).
var bindPort = builder.Configuration["PORT"] ?? "5001";
builder.WebHost.UseUrls($"http://0.0.0.0:{bindPort}");

// 1. Database Configuration (Strictly PostgreSQL via .env or configuration)
var connString = builder.Configuration["DATABASE_URL"]
    ?? builder.Configuration.GetConnectionString("Default");

if (string.IsNullOrWhiteSpace(connString))
{
    throw new InvalidOperationException("DATABASE_URL or ConnectionStrings:Default is missing! Please provide a valid PostgreSQL connection string in your .env file (e.g. DATABASE_URL=Host=localhost;Port=5432;Database=statusenzin_dev;Username=postgres;Password=your_password).");
}

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connString);
});

// 2. Identity Configuration
builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 8;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// 3. JWT Authentication
var jwtSecret = builder.Configuration["JWT_KEY"] ?? builder.Configuration["Jwt:Key"] ?? "StatusEnzinSuperSecretKeyForJWTAuth2026!MustBeVeryLong";
var jwtIssuer = builder.Configuration["JWT_ISSUER"] ?? builder.Configuration["Jwt:Issuer"] ?? "StatusEnzin";
var jwtAudience = builder.Configuration["JWT_AUDIENCE"] ?? builder.Configuration["Jwt:Audience"] ?? "StatusEnzinApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.ContainsKey("statusenzin_jwt"))
            {
                context.Token = context.Request.Cookies["statusenzin_jwt"];
            }
            return Task.CompletedTask;
        }
    };
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };
});

// 4. Custom Services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantProvider, TenantProvider>();
builder.Services.AddScoped<IEmailService, ResendEmailService>();
builder.Services.AddScoped<IStripeService, StripeService>();

// 5. Background Hosted Service
builder.Services.AddHostedService<MonitorCheckWorker>();

// 6. Controllers & CORS
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
var allowedOrigins = builder.Configuration["ALLOWED_ORIGINS"]?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();

// 7. Apply pending EF Core migrations, then seed data.
// Demo content (Acme status page) only runs when SEED_DEMO_DATA=true (see DbSeeder).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

    db.Database.Migrate();

    await DbSeeder.SeedAsync(db, userManager, builder.Configuration);
}

app.UseRouting();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check for Docker healthchecks, load balancers, and uptime probes.
app.MapGet("/health", async (AppDbContext db) =>
{
    await db.Database.ExecuteSqlRawAsync("SELECT 1");
    return Results.Ok(new { status = "healthy", database = "ok", timestamp = DateTime.UtcNow });
});

app.Run();
