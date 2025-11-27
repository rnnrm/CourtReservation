
using CourtBooking.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace CourtBooking.Server.Endpoints;

public static class AuthEndpoints
{
    public static WebApplication MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/register", async (
            RegisterRequest request,
            UserManager<AppUser> userManager,
            RoleManager<IdentityRole> roleManager,
            SignInManager<AppUser> signInManager) =>
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return Results.BadRequest("Email and Password are required.");

            var user = new AppUser { UserName = request.Name, Email = request.Email, Rank = 9999 };
            var result = await userManager.CreateAsync(user, request.Password!);
            if (!result.Succeeded)
                return Results.ValidationProblem(result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description }));

            await userManager.AddToRoleAsync(user, "Guest");
            await signInManager.SignInAsync(user, isPersistent: false);
            return Results.Ok();
        });

        group.MapPost("/login", async (
            LoginRequest request,
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager) =>
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return Results.BadRequest("Email and Password are required.");

            var user = await userManager.FindByEmailAsync(request.Email);
            if (user == null) return Results.NotFound("User not found");

            if (!await userManager.CheckPasswordAsync(user, request.Password))
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["Credentials"] = new[] { "Invalid credentials." } });

           // userManager.GetRolesAsync(user);
            await signInManager.SignInAsync(user, isPersistent: true);
            //var userRole = signInManager.Context.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
            var role = signInManager.Context.User.IsInRole("Admin") ? "Admin" : signInManager.Context.User.IsInRole("Member") ? "Member" : "Guest";
            return Results.Ok(new { email = user.Email, name = user.UserName, role, user.Rank });
        });

        group.MapGet("/logout", [Authorize] async (SignInManager<AppUser> signInManager) =>
        {
            await signInManager.SignOutAsync();
            return Results.Ok();
        });

        //check if logged in
        group.MapGet("/check", async (SignInManager<AppUser> signInManager) =>
        {
            var user = signInManager.Context.User;
            var isAuthenticated = user.Identity!.IsAuthenticated;
            var role = user.IsInRole("Admin") ? "Admin" : user.IsInRole("Member") ? "Member" : "";

            if (isAuthenticated) {
                var email = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                var appuser = await signInManager.UserManager.FindByEmailAsync(email);
                return Results.Ok(new { name = user.Identity.Name, email, role, appuser?.Rank });
            }
            else
                return Results.Unauthorized();
        });

        //change password
        group.MapPost("/reset", [Authorize("Admin")] async (UserManager<AppUser> userManager, string userEmail, string newPassword) =>
        {
            var user = await userManager.FindByEmailAsync(userEmail);
            if (user == null)
                return Results.NotFound();
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
            await userManager.ResetPasswordAsync(user, resetToken, newPassword);
            return Results.Ok();
        });

        return app;
    }
}