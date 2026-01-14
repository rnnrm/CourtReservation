using CourtBooking.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;
using static CourtBooking.Server.Controllers.BookingsController;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace CourtBooking.Server.Controllers
{
    public record UserViewModel(string Name, string Id, string[] Roles, int? MemberNumber);

    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        /*private void RemoveRank(AppUser user)
        {
            var userRank = user.Rank;
            if (userRank > 0)
            {
                var usersToUpdate = _userManager.Users.Where(u => u.Rank > userRank).ToList();
                foreach (var u in usersToUpdate)
                {
                    u.Rank -= 1;
                }
            }
            user.Rank = 0;
        }*/

        public UsersController([FromServices] UserManager<AppUser> userManager, [FromServices] RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        //get all users
        // GET: api/Users
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<Dictionary<string, UserViewModel>>> Get()
        {
            var users = await _userManager.Users.ToListAsync();

            var list = new List<UserViewModel>();
            foreach (var u in users)
            {
                var roles = await _userManager.GetRolesAsync(u);
                list.Add(new UserViewModel(
                    u.UserName ?? string.Empty,
                    u.Id ?? string.Empty,
                    roles?.ToArray() ?? Array.Empty<string>(),
                    u.MemberNumber
                ));
            }

            var dict = list.ToDictionary(x => x.Id, x => x);

            return Ok(dict);
        }

        public class RoleParameters
        {
            public required string Id { get; set; }
            public required string Role { get; set; }
        }

        // PUT api/<Users>/role
        [HttpPatch("toggleRole")]
        public async Task<IActionResult> Patch([FromServices] RoleManager<IdentityRole> roleManager, [FromServices] ApplicationDbContext db, [FromBody] RoleParameters p)
        {
            var currentUser = await _userManager.FindByIdAsync(p.Id);
            if (currentUser == null) return NotFound();

            IdentityResult roleresult;
            if (await _userManager.IsInRoleAsync(currentUser!, p.Role))
            {
                roleresult = await _userManager.RemoveFromRoleAsync(currentUser!, p.Role);
                /*if (p.Role == "Member")
                {
                    RemoveRank(currentUser);
                    await _userManager.UpdateAsync(currentUser);
                }*/
            }
            else
            {
                roleresult = await _userManager.AddToRoleAsync(currentUser!, p.Role);
                /* if (p.Role == "Member")
                {
                   // Find the RoleId for "Member"
                    var memberRole = await roleManager.FindByNameAsync("Member");
                    if (memberRole != null)
                    {
                        // Query AspNetUserRoles for user ids that have the Member role
                        var memberUserIds = db.Set<IdentityUserRole<string>>()
                                              .Where(ur => ur.RoleId == memberRole.Id)
                                              .Select(ur => ur.UserId);

                        // Compute max rank among those users (exclude nulls)
                        var maxRank = await db.Users
                                              .Where(u => memberUserIds.Contains(u.Id))
                                              .MaxAsync(u => (int?)u.Rank) ?? 0;

                        currentUser.Rank = maxRank + 1;
                        //generate member number
                        if (currentUser.MemberNumber == null)
                        {
                            var MaxMemberNumber = await db.Users.MaxAsync(u => (int?)u.MemberNumber) ?? 0;
                            currentUser.MemberNumber = MaxMemberNumber + 1;
                        }
                    }
                    else
                    {
                        currentUser.Rank = 1;
                    }
                    await _userManager.UpdateAsync(currentUser);
                }*/
            }
            await db.SaveChangesAsync();

            return roleresult.Succeeded ? Ok() : Problem(roleresult.Errors.ToString());
        }

        // DELETE api/Users
        [HttpDelete]
        public async Task<IActionResult> Delete([FromServices] ApplicationDbContext db, [FromBody] string Id)
        {
            var user = await _userManager.FindByIdAsync(Id);
            if (user != null)
            {
                //RemoveRank(user);

                //delete users reservaions
                db.RemoveRange(db.Reservations.Where(r => r.ExtendedProps.Owner == user.Id));

                //delete user
                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                    return BadRequest(result.Errors.Select(e => e.Description));

                await db.SaveChangesAsync();
                return Ok();
            }
            return NotFound("User not found");
        }
    }
}
