using CourtBooking.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace CourtBooking.Server.Controllers
{
    public record UserViewModel(string Name, string Id, string[] Roles, int? MemberNumber);

    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController([FromServices] UserManager<AppUser> userManager, [FromServices] RoleManager<IdentityRole> roleManager, [ FromServices] ApplicationDbContext db) : ControllerBase
    {

        //get all users
        // GET: api/Users
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<Dictionary<string, UserViewModel>>> Get()
        {
            var users = await userManager.Users.ToListAsync();

            var list = new List<UserViewModel>();
            foreach (var u in users)
            {
                var roles = await userManager.GetRolesAsync(u);
                list.Add(new UserViewModel(
                    u.UserName ?? string.Empty,
                    u.Id ?? string.Empty,
                    roles?.ToArray() ?? [],
                    u.MemberNumber
                ));
            }

            var dict = list.ToDictionary(x => x.Id, x => x);

            return Ok(dict);
        }

        public record MembernumParameters
        {
            public required string Id { get; set; }
            public required int MemberNumber { get; set; }
        }

        [HttpPost("setMemberNumber")]
        public async Task<IActionResult> SetMemberNumber([FromBody] MembernumParameters membernumParameters)
        {
            var user = await userManager.FindByIdAsync(membernumParameters.Id);
            if (user == null) return NotFound("User not found");
            user.MemberNumber = membernumParameters.MemberNumber;
            await userManager.UpdateAsync(user);

            return Ok();
        }

        public class RoleParameters
        {
            public required string Id { get; set; }
            public required string Role { get; set; }
        }

        // PUT api/<Users>/role
        [HttpPatch("toggleRole")]
        public async Task<IActionResult> Patch( [FromBody] RoleParameters p)
        {
            var currentUser = await userManager.FindByIdAsync(p.Id);
            if (currentUser == null) return NotFound();

            IdentityResult roleresult;
            if (await userManager.IsInRoleAsync(currentUser!, p.Role))
            {
                roleresult = await userManager.RemoveFromRoleAsync(currentUser!, p.Role);
                /*if (p.Role == "Member")
                {
                    RemoveRank(currentUser);
                    await _userManager.UpdateAsync(currentUser);
                }*/
            }
            else
            {
                roleresult = await userManager.AddToRoleAsync(currentUser!, p.Role);
                if (p.Role == "Member")
                {
                   // Find the RoleId for "Member"
                    var memberRole = await roleManager.FindByNameAsync("Member");
                    if (memberRole != null)
                    {
                        /*// Query AspNetUserRoles for user ids that have the Member role
                        var memberUserIds = db.Set<IdentityUserRole<string>>()
                                              .Where(ur => ur.RoleId == memberRole.Id)
                                              .Select(ur => ur.UserId);

                        // Compute max rank among those users (exclude nulls)
                        var maxRank = await db.Users
                                              .Where(u => memberUserIds.Contains(u.Id))
                                              .MaxAsync(u => (int?)u.Rank) ?? 0;

                        currentUser.Rank = maxRank + 1;*/
                        //generate member number
                        if (currentUser.MemberNumber == null)
                        {
                            var MaxMemberNumber = await db.Users.MaxAsync(u => (int?)u.MemberNumber) ?? 0;
                            currentUser.MemberNumber = MaxMemberNumber + 1;
                        }
                    }
                    await userManager.UpdateAsync(currentUser);
                }
            }
            await db.SaveChangesAsync();

            return roleresult.Succeeded ? Ok() : Problem(roleresult.Errors.ToString());
        }

        // DELETE api/Users
        [HttpDelete]
        public async Task<IActionResult> Delete([FromBody] string Id)
        {
            var user = await userManager.FindByIdAsync(Id);
            if (user != null)
            {
                //RemoveRank(user);

                //delete users reservaions
                db.RemoveRange(db.Reservations.Where(r => r.ExtendedProps.Owner == user.Id));

                //delete user
                var result = await userManager.DeleteAsync(user);
                if (!result.Succeeded)
                    return BadRequest(result.Errors.Select(e => e.Description));

                await db.SaveChangesAsync();
                return Ok();
            }
            return NotFound("User not found");
        }
    }
}
