using CourtBooking.Server.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using static CourtBooking.Server.Controllers.UsersController;

namespace CourtBooking.Server.Controllers
{

    
    public record LadderResultParameters(string User, string Opponent, int Result);

    [Route("api/[controller]")]
    [ApiController]
    public class LadderController : ControllerBase
    {

        // PUT api/<Users>/role
        [HttpPost("ladder")]
        public async Task<IActionResult> Post([FromServices] UserManager<AppUser> _userManager, [FromServices] ApplicationDbContext db, [FromBody] LadderResultParameters p)
        {
            try { 
                DateOnly today = new DateOnly();
                var user = await _userManager.FindByEmailAsync(p.User);
                var opponent = await _userManager.FindByEmailAsync(p.Opponent);
                //db.ResultsTable.Where( val => val.Date == today && val.User == opponent.Name && val.Result == p.Result);
                //update both ranks, move other down/up
                //else store result as pending confirm from other user
            } catch(Exception e) {
            };

            return Ok(); ;

        }
    }
}
