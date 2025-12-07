
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

            try
            {
                throw new Exception("test");
                var user = new AppUser { UserName = request.Name, Email = request.Email, Rank = 0 };
                var result = await userManager.CreateAsync(user, request.Password!);
                if (!result.Succeeded)
                    return Results.ValidationProblem(result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description }));

                return Results.Ok();
            }
            catch (Exception e)
            {
                Console.WriteLine("e.Message " + e.Message);
                return Results.Problem(e.Message);
            }
        });

        group.MapPost("/login", async (
            LoginRequest request,
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager) =>
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return Results.BadRequest("Email and Password are required.");
            try
            {
                var user = await userManager.FindByEmailAsync(request.Email);
                if (user == null) return Results.NotFound("User not found");

                if (!await userManager.CheckPasswordAsync(user, request.Password))
                    return Results.ValidationProblem(new Dictionary<string, string[]> { ["Credentials"] = ["Invalid credentials."] });

                // userManager.GetRolesAsync(user);
                await signInManager.SignInAsync(user, isPersistent: true);
                //var userRole = signInManager.Context.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
                var role = signInManager.Context.User.IsInRole("Admin") ? "Admin" : signInManager.Context.User.IsInRole("Member") ? "Member" : "Guest";
                return Results.Ok(new { user.Id, name = user.UserName, role, user.Rank });
            }
            catch (Exception e)
            {
                Console.WriteLine("e.Message " + e.Message);
                return Results.Problem(e.Message);
            }
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

            if (isAuthenticated)
            {
                var id = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                var appuser = await signInManager.UserManager.FindByIdAsync(id);
                return Results.Ok(new { name = user.Identity.Name, appuser?.Id, role, appuser?.Rank });
            }
            else
                return Results.Unauthorized();
        });

        //change password
        group.MapPost("/reset", [Authorize("Admin")] async (UserManager<AppUser> userManager, string Id, string newPassword) =>
        {
            var user = await userManager.FindByIdAsync(Id);
            if (user == null)
                return Results.NotFound();
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
            await userManager.ResetPasswordAsync(user, resetToken, newPassword);
            return Results.Ok();
        });

        //google id
        //maybe signin-google does this already
        group.MapPost("/google", async (UserManager<AppUser> userManager, string Id, string Name) =>
        {
            //fetch("google.com/tokenverify?Id=" + Id);
            //find user by id
            //if none register user
            //get display name from gogole account
        });

        return app;
    }
}