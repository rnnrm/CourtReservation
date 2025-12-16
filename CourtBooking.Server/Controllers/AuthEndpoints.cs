using CourtBooking.Server.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Net.Http;
using System.Security.Claims;
using System.Security.Principal;

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

        group.MapGet("/logout", [Authorize] async (HttpContext httpContext, SignInManager<AppUser> signInManager) =>
        {
            await signInManager.SignOutAsync();
            await httpContext.SignOutAsync(IdentityConstants.ExternalScheme);
            //await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
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
                var appuser = await signInManager.UserManager.FindByIdAsync(id!);
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

        group.MapGet("/login-google", async (IConfiguration config, HttpContext httpContext) =>
        {
            string redirectUri = config["FRONTEND_URL"] + "/api/auth/signin-google-callback";
            var properties = new AuthenticationProperties { RedirectUri = redirectUri };
            await httpContext.ChallengeAsync(GoogleDefaults.AuthenticationScheme, properties);
        });

        group.MapGet("/signin-google-callback", async (HttpContext httpContext, SignInManager<AppUser> signInManager, string redirectUri = "/") =>
        {
            
            //var name = User.FindFirstValue(ClaimTypes.Name);
            var result = await httpContext.AuthenticateAsync(IdentityConstants.ExternalScheme);
            if (!result.Succeeded)
                return Results.Redirect($"/?error=ExternalAuthFailed");
            //return Results.Unauthorized();

            var externalUserId = result.Principal.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
            var email = result.Principal.FindFirst(ClaimTypes.Email)?.Value;
            var name = result.Principal.FindFirst(ClaimTypes.Name)?.Value;
            var user = await signInManager.UserManager.FindByLoginAsync("Google", externalUserId);
            if (user == null && email != null)
            {
                user = await signInManager.UserManager.FindByEmailAsync(email);
                if (user == null)
                {
                    user = new AppUser { Id = externalUserId, UserName = name ?? email, Email = email, Rank = 0 };
                    await signInManager.UserManager.CreateAsync(user);
                }
                await signInManager.UserManager.AddLoginAsync(user, new UserLoginInfo("Google", externalUserId, "Google"));
            }
            if (user != null)
            {
                await signInManager.SignInAsync(user, isPersistent: true);
                await httpContext.SignOutAsync(IdentityConstants.ExternalScheme);
                //return Results.Ok(new { user.Id, name = user.UserName, role = "Member", user.Rank });
                return Results.Redirect(redirectUri);
            }
            //return Results.Unauthorized();
            return Results.Redirect($"/?error=CreateFailed");
            //return Results.Redirect(returnUrl);
        });

        /* group.MapGet("/mysignin-google", async (HttpContext httpContext, SignInManager<AppUser> signInManager, string returnUrl = "/") =>
         {
             // Use SignInManager helpers to read the external cookie and sign in or create local user.
             var info = await signInManager.GetExternalLoginInfoAsync();
             if (info == null)
                 return Results.Redirect($"/?error=ExternalAuthFailed");

             var signInResult = await signInManager.ExternalLoginSignInAsync(info.LoginProvider, info.ProviderKey, isPersistent: true);
             if (signInResult.Succeeded)
             {
                 await httpContext.SignOutAsync(IdentityConstants.ExternalScheme);
                 return Results.Redirect(returnUrl);
             }

             var email = info.Principal.FindFirstValue(ClaimTypes.Email);
             var name = info.Principal.FindFirstValue(ClaimTypes.Name) ?? email ?? info.ProviderKey;
             var externalUserId = info.Principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
             var user = email != null ? await signInManager.UserManager.FindByEmailAsync(email) : null;
             if (user == null)
             {
                 user = new AppUser { Id = externalUserId, UserName = name, Email = email, Rank = 0 };
                 var createRes = await signInManager.UserManager.CreateAsync(user);
                 if (!createRes.Succeeded)
                     return Results.Redirect($"/?error=CreateFailed");
             }

             await signInManager.UserManager.AddLoginAsync(user, new UserLoginInfo(info.LoginProvider, info.ProviderKey, info.ProviderDisplayName));
             await signInManager.SignInAsync(user, isPersistent: true);
             await httpContext.SignOutAsync(IdentityConstants.ExternalScheme);
             return Results.Redirect(returnUrl);
         });*/

        /*        group.MapGet("/login-facebook", async (HttpContext httpContext, string returnUrl = "/") =>
                {
                    var properties = new AuthenticationProperties { RedirectUri = returnUrl };
                    await httpContext.ChallengeAsync(FacebookDefaults.AuthenticationScheme, properties);
                    //return Challenge(properties, "Facebook");
                });*/

        /*
                group.MapGet("/signin-facebook", async (HttpContext httpContext, SignInManager<AppUser> signInManager) =>
                {
                    var result = await httpContext.AuthenticateAsync(IdentityConstants.ExternalScheme);
                    if (!result.Succeeded)
                        return Results.Unauthorized();
                    var externalUserId = result.Principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    var email = result.Principal.FindFirst(ClaimTypes.Email)?.Value;
                    var name = result.Principal.FindFirst(ClaimTypes.Name)?.Value;
                    var user = await signInManager.UserManager.FindByLoginAsync("Facebook", externalUserId);
                    if (user == null && email != null)
                    {
                        user = await signInManager.UserManager.FindByEmailAsync(email);
                        if (user == null)
                        {
                            user = new AppUser { UserName = name ?? email, Email = email, Rank = 0 };
                            await signInManager.UserManager.CreateAsync(user);
                        }
                        await signInManager.UserManager.AddLoginAsync(user, new UserLoginInfo("Facebook", externalUserId, "Facebook"));
                    }
                    if (user != null)
                    {
                        await signInManager.SignInAsync(user, isPersistent: true);
                        await httpContext.SignOutAsync(IdentityConstants.ExternalScheme);
                        return Results.Ok(new { user.Id, name = user.UserName, role = "Member", user.Rank });
                    }
                    return Results.Unauthorized();
                });
        */
        return app;
    }
}