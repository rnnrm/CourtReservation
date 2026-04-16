using CourtBooking.Server;
using CourtBooking.Server.Endpoints;
using CourtBooking.Server.Models;
//using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

using CourtBooking.Server.Services;

var builder = WebApplication.CreateBuilder(args);
// Add Docker secrets directory if it exists
var secretsPath = "/run/secrets";
if (Directory.Exists(secretsPath))
{
    builder.Configuration.AddKeyPerFile(directoryPath: secretsPath, optional: true);
}

builder.Services.AddHostedService<PrunePendingMatchesService>();

// Add services to the container.
builder.Services.AddSingleton<EmailSender>(sp => new EmailSender(
    builder.Configuration["EMAIL_SERVER"],
    builder.Configuration["EMAIL_ADDRESS"],
    builder.Configuration["email_password"]));
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<ApplicationDbContext>(
    options =>
    options.UseSqlite(Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
        ?? "Data Source=app.db",
        b => b.MigrationsAssembly("CourtBooking.Server")));

builder.Services.AddDatabaseDeveloperPageExceptionFilter();

builder.Services.AddAuthentication()
/*.AddGoogle(googleOptions =>
{
    googleOptions.ClientId = builder.Configuration["google_client_id"]!;
    googleOptions.ClientSecret = builder.Configuration["google_client_secret"]!;
    googleOptions.CallbackPath = builder.Configuration["GOOGLE_CALLBACK"];
    googleOptions.SignInScheme = IdentityConstants.ExternalScheme;

    googleOptions.Scope.Add("profile");
    googleOptions.Scope.Add("email");
    googleOptions.SaveTokens = true;
})*/
;

builder.Services.AddAuthorization();
builder.Services.AddIdentity<AppUser, IdentityRole>(cfg =>
{
    cfg.Password.RequireDigit = false;
    cfg.Password.RequiredLength = 6;
    cfg.Password.RequireNonAlphanumeric = false;
    cfg.Password.RequireUppercase = false;
    cfg.Password.RequireLowercase = false;
    cfg.User.RequireUniqueEmail = true;
    cfg.User.AllowedUserNameCharacters += ' ';
})
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowVercel", policy =>
    {
        policy.WithOrigins("https://kenrho.vercel.app")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AllowVercel");
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    // turn on PII logging
    //Microsoft.IdentityModel.Logging.IdentityModelEventSource.ShowPII = true;
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseDeveloperExceptionPage();

app.MapAuthEndpoints();
app.MapControllers();

app.MapFallbackToFile("/index.html");
app.MapSwagger();//.RequireAuthorization();
await EnsureDatabaseMigratedAsync(app);

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ApplicationDbContext>();
    var userManager = services.GetRequiredService<UserManager<AppUser>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

    //context.Database.EnsureCreated();
    if (app.Environment.IsDevelopment())
        context.Database.Migrate();

    // Seed datas
    if (!context.Users.Any())
    {
        if (!await roleManager.RoleExistsAsync("Member"))
        {
            await roleManager.CreateAsync(new IdentityRole("Member"));
            //await roleManager.CreateAsync(new IdentityRole("Guest"));
            await roleManager.CreateAsync(new IdentityRole("Admin"));
        }
        var user = new AppUser
        {
            UserName = "ClubAdmin",
            Email = builder.Configuration["admin_email"] ?? "aa@aa.aa"
        };
        var adminPassword = builder.Configuration["admin_password"] ?? "password";
        await userManager.CreateAsync(user, adminPassword);
        await userManager.AddToRoleAsync(user, "Admin");
    }
}

static async Task EnsureDatabaseMigratedAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var db = services.GetRequiredService<ApplicationDbContext>();

    // If using SQLite with a file path (Data Source=/app/app.db) ensure the directory exists
    try
    {
        var conn = db.Database.GetDbConnection().ConnectionString;
        if (!string.IsNullOrEmpty(conn) &&
            conn.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase))
        {
            var path = conn["Data Source=".Length..].Trim();
            var dir = Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                Directory.CreateDirectory(dir);
        }
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Failed to ensure SQLite directory exists");
    }

    // Retry applying migrations a few times while DB becomes available
    var attempts = 6;
    for (var attempt = 1; attempt <= attempts; attempt++)
    {
        try
        {
            db.Database.Migrate();
            logger.LogInformation("Database migrations applied successfully.");
            return;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Database migrate attempt {Attempt}/{Attempts} failed", attempt, attempts);
            if (attempt == attempts)
            {
                logger.LogError(ex, "All attempts to migrate the database have failed.");
                throw;
            }

            await Task.Delay(TimeSpan.FromSeconds(5));
        }
    }

}

app.Run();
