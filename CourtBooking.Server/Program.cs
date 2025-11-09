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
    cfg.Password.RequireDigit = true;
    cfg.Password.RequiredLength = 6;
    cfg.Password.RequireNonAlphanumeric = false;
    cfg.Password.RequireUppercase = false;
    cfg.Password.RequireLowercase = true;
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

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

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



//app.MapPost("/api/auth/logout", async (SignInManager<AppUser> signInManager,
//    [FromBody] object empty) =>
//{
//    if (empty != null)
//    {
//        await signInManager.SignOutAsync();
//        return Results.Ok();
//    }
//    return Results.Unauthorized();
//})
////.WithOpenApi()
//.RequireAuthorization();

//app.MapPost("/api/auth/register", async (
//    RegisterRequest request,
//    UserManager<AppUser> userManager,
//    RoleManager<IdentityRole> roleManager,
//    SignInManager<AppUser> signInManager) =>
//{
//    var user = new AppUser { UserName = request.Name, Email = request.Email };
//    var result = await userManager.CreateAsync(user, request.Password!);

//    if (!result.Succeeded)
//    {
//        System.Text.StringBuilder err = new System.Text.StringBuilder();
//        foreach (var error in result.Errors)
//        {
//            err.Append(error.Description);
//        }
//        return Results.BadRequest( err.ToString());
//    }
//    await userManager.AddToRoleAsync(user, "Guest");
//    await signInManager.SignInAsync(user, isPersistent: false);
//    return Results.Ok();
//});

//app.MapPost("/api/auth/login", async (
//    LoginRequest request,
//    UserManager<AppUser> userManager,
//    RoleManager<IdentityRole> roleManager,
//    SignInManager<AppUser> signInManager) =>
//{
//    //var user = new AppUser { UserName = request.Email, Email = request.Email };

//    var user = await userManager.FindByEmailAsync(request.Email);
//    if (user == null)
//        //return Results.ValidationProblem(new Dictionary<string, string[]>
//        //{
//        //    ["User not found"] = new[] { "User not found" }
//        //});
//        return Results.NotFound("User not found");

//    //if (!user.EmailConfirmed)
//    //{
//    //    return Results.BadRequest("Email not confirmed yet");

//    //}
//    if (await userManager.CheckPasswordAsync(user, request.Password) == false)
//    {
//        return Results.NotFound("Invalid credentials.");
//        //return Results.ValidationProblem(new Dictionary<string, string[]>
//        //{
//        //    ["Credentials"] = new[] { "Invalid credentials." }
//        //});
//    }

//     await signInManager.SignInAsync(user, isPersistent: true);
//    //var result = await signInManager.PasswordSignInAsync(user, request.Password, isPersistent: true, lockoutOnFailure:false);

//    //if (!result.Succeeded)
//    //{
//    //    Console.WriteLine("ERROR HAPPEN: "+result);
//    //    return Results.BadRequest(result.ToString());
//    //}
//    //else if (result.IsLockedOut)
//    //{
//    //    return Results.BadRequest("AccountLocked");
//    //}
//    //else
//    //{
//    //    return Results.BadRequest("Invalid login attempt");
//    //}

//    return Results.Ok();
//});

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
            Email = "aa@aa.aa"
        };
        await userManager.CreateAsync(user, "p@staW0rd!");
        await userManager.AddToRoleAsync(user, "Admin");
    }
};

app.Run();
