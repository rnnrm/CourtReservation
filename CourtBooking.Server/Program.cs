using CourtBooking.Server;
using CourtBooking.Server.Endpoints;
using CourtBooking.Server.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.VisualBasic;
using System;
using System.Data;
using LoginRequest = CourtBooking.Server.Models.LoginRequest;
using RegisterRequest = CourtBooking.Server.Models.RegisterRequest;

//TODO migrate databse updates
//merge deploy withouy overwriting database
//google,facebook logins
//ladder list, update scores
// check 500 errors, offline notification
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

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

builder.Services.AddAuthorization();
builder.Services.AddIdentity<AppUser, IdentityRole>(cfg =>
{
    cfg.Password.RequireDigit = false;
    cfg.Password.RequiredLength = 6;
    cfg.Password.RequireNonAlphanumeric = false;
    cfg.Password.RequireUppercase = false;
    cfg.Password.RequireLowercase = false;
    cfg.User.RequireUniqueEmail = true;
})
//builder.Services.AddIdentityApiEndpoints<IdentityUser>()
//builder.Services.AddIdentityApiEndpoints<AppUser>() //AppUser, IdentityRole
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

//builder.AddSignInManager<SignInManager<AppUser>>();
//builder.Services.TryAddScoped<SignInManager<AppUser>>();

builder.Services.ConfigureApplicationCookie(options =>
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
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowVercel", policy =>
    {
        policy.WithOrigins("https://kenrho.vercel.app") // <-- replace with your Vercel URL
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();
// Add before app.UseAuthentication(); and after app.UseStaticFiles();
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

//app.MapGroup("/api/auth").MapIdentityApi<AppUser>();
app.MapAuthEndpoints();
app.MapControllers();

app.MapFallbackToFile("/index.html");
app.MapSwagger();//.RequireAuthorization();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ApplicationDbContext>();
    var userManager = services.GetRequiredService<UserManager<AppUser>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

    //context.Database.EnsureCreated();
    //context.Database.Migrate();

    // Seed datas
    if (!context.Users.Any())
    {
        if (!await roleManager.RoleExistsAsync("Member"))
        {
            await roleManager.CreateAsync(new IdentityRole("Member"));
            await roleManager.CreateAsync(new IdentityRole("Guest"));
            await roleManager.CreateAsync(new IdentityRole("Admin"));
        }
        var user = new AppUser
        {
            UserName = "ClubAdmin",
            Email = "aa@aa.aa",
            Rank=999
        };
        await userManager.CreateAsync(user, "p@staW0rd!");
        await userManager.AddToRoleAsync(user, "Admin");
    }
};

app.Run();
