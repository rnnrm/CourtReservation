using CourtBooking.Server;
using CourtBooking.Server.Endpoints;
using CourtBooking.Server.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

// TODO: migrate databse updates (automatically on deploy? when not to)
// TODO: merge deploy without overwriting database
// TODO: unit tests
// TODO: google,facebook logins
// TODO: check 500 errors,\/
// TODO: public github?
// TODO: deploy docker image to registry run release mode
// TODO: auto deploy CI github actions
// TODO: env variables for connection strings, secrets, page config
// TODO: validate match form
// TODO: set owner id to id not email on old records?

var builder = WebApplication.CreateBuilder(args);
// Add Docker secrets directory if it exists
var secretsPath = "/run/secrets";
if (Directory.Exists(secretsPath))
{
    builder.Configuration.AddKeyPerFile(directoryPath: secretsPath, optional: true);
}

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
    options => //options.UseInMemoryDatabase("AppDb"));
    options.UseSqlite(
        /*builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? */Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
        ?? "Data Source=app.db",
        b => b.MigrationsAssembly("CourtBooking.Server")));

builder.Services.AddDatabaseDeveloperPageExceptionFilter();

builder.Services.AddAuthentication()
/*    options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
})
.AddCookie()*/
.AddGoogle(googleOptions =>
{
    googleOptions.ClientId = builder.Configuration["google_client_id"]!;
    googleOptions.ClientSecret = builder.Configuration["google_client_secret"]!;
    googleOptions.CallbackPath = builder.Configuration["GOOGLE_CALLBACK"];
    googleOptions.SignInScheme = IdentityConstants.ExternalScheme;

    // Ensure correlation/nonce cookies survive the cross-site redirect back from Google
    //googleOptions.CorrelationCookie.SameSite = SameSiteMode.None;
    //googleOptions.NonceCookie.SameSite = SameSiteMode.None;
    //googleOptions.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
    //googleOptions.NonceCookie.SecurePolicy = CookieSecurePolicy.Always;

    googleOptions.Scope.Add("profile");
    googleOptions.Scope.Add("email");
    googleOptions.SaveTokens = true;
   /* googleOptions.Events.OnCreatingTicket = ctx =>
    {
        var identity = (ClaimsIdentity)ctx.Principal.Identity;
        var profilePic = ctx.User.GetProperty("picture").GetString();
        var email = ctx.User.GetProperty("email").GetString();
        var name = ctx.User.GetProperty("name").GetString();
        // Add claims
        identity.AddClaim(new Claim("profilePic", profilePic));
        identity.AddClaim(new Claim(ClaimTypes.Email, email));
        identity.AddClaim(new Claim(ClaimTypes.Name, name));
        return Task.CompletedTask;
    };*/
});
/*builder.Services.Configure<CookiePolicyOptions>(options =>
{
    // This lambda determines whether user consent for non-essential cookies is needed for a given request.
    options.CheckConsentNeeded = context => true;
    options.MinimumSameSitePolicy = SameSiteMode.Unspecified;
});*/
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
//builder.Services.AddIdentityApiEndpoints<IdentityUser>()
//builder.Services.AddIdentityApiEndpoints<AppUser>() //AppUser, IdentityRole
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();
//builder.AddSignInManager<SignInManager<AppUser>>();
//builder.Services.TryAddScoped<SignInManager<AppUser>>();

/*builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events.OnRedirectToLogin = ctx =>
    {
        if (ctx.Request.Path.StartsWithSegments("/") ||
            ctx.Request.Headers["Accept"].ToString().Contains("application/json"))
        {
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        }
        ctx.Response.Redirect(ctx.RedirectUri);
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = ctx =>
    {
        if (ctx.Request.Path.StartsWithSegments("/") ||
            ctx.Request.Headers["Accept"].ToString().Contains("application/json"))
        {
            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        }
        ctx.Response.Redirect(ctx.RedirectUri);
        return Task.CompletedTask;
    };
});*/

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
            Email = "aa@aa.aa"
        };
        await userManager.CreateAsync(user, "p@staW0rd!");
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
