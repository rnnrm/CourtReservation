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
    public record UserRolesViewModel(string Name, string Email, string[] Roles);

    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public UsersController([FromServices] UserManager<AppUser> userManager, [FromServices] RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        // GET: api/<Users>
        [HttpGet]
        public async Task<ActionResult<Dictionary<string, UserRolesViewModel>>> Get()
        {
            var users = await _userManager.Users.ToListAsync();

            var list = new List<UserRolesViewModel>();
            foreach (var u in users)
            {
                var roles = await _userManager.GetRolesAsync(u);
                list.Add(new UserRolesViewModel(
                    u.UserName ?? string.Empty,
                    u.Email ?? string.Empty,
                    roles?.ToArray() ?? Array.Empty<string>()
                ));
            }

            var dict = list.ToDictionary(x => x.Email, x => x);

            // Safe logging (avoid indexing into empty arrays)
            foreach (var kv in dict)
            {
                var rolesText = kv.Value.Roles.Length > 0 ? string.Join(",", kv.Value.Roles) : "(no roles)";
                Console.WriteLine($"user {kv.Value.Name} roles: {rolesText}");
            }

            return Ok(dict);
        }

        // GET api/<Users>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {

            return "value";
        }

        //// POST api/<Users>
        //[AllowAnonymous]
        //[HttpGet]
        //public bool GetRole()
        //{
        //    return HttpContext.User.IsInRole("Admin");
        //    //if ((bool)(HttpContext.User.Identity?.IsAuthenticated))
        //}

        // POST api/<Users>
        [HttpPost]
        public void Post([FromBody] string value)
        {
        }

        public class RoleParameters
        {
            public required string Email { get; set; }
            public required string Role { get; set; }
        }

        // PUT api/<Users>/role
        [HttpPatch("toggleRole")]
        public async Task<IActionResult> Patch( [FromBody] RoleParameters p )
        {
            var currentUser = await _userManager.FindByEmailAsync(p.Email);
            if (currentUser == null) return NotFound();

            IdentityResult roleresult;
            if (await _userManager.IsInRoleAsync(currentUser!, p.Role))
            {
                roleresult = await _userManager.RemoveFromRoleAsync(currentUser!, p.Role);

            }
            else {
                roleresult = await _userManager.AddToRoleAsync(currentUser!, p.Role);
            }

            return roleresult.Succeeded ? Ok() : Problem(roleresult.Errors.ToString());
        }

        // DELETE api/<Users>
        [HttpDelete]
        public async Task<IActionResult> Delete([FromServices] ApplicationDbContext db, [FromBody] string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user != null)
            {
                //delete users reservaions
                db.RemoveRange( db.Reservations.Where(r => r.ExtendedProps.Owner == user.Email) );

                //delete user
                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                    return BadRequest( result.Errors.Select(e => e.Description));

                await db.SaveChangesAsync();
                return Ok();
            }
            return NotFound("User not found");
        }
    }
}
