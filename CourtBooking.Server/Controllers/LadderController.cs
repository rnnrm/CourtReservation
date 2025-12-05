using CourtBooking.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CourtBooking.Server.Controllers
{
    public record LadderResultParameters(string CompetitionName, string Opponent, int[] Score, DateOnly DatePlayed, string? Partner = null, string? Opponent2 = null);

    [Authorize(Roles = "Member,Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class LadderController : ControllerBase
    {

        [HttpPost]
        public async Task<IActionResult> Post([FromServices] UserManager<AppUser> _userManager, [FromServices] ApplicationDbContext db, [FromBody] LadderResultParameters p)
        {
            //prune unconfirmed matches older than 14 days
            db.MatchResults.RemoveRange(db.MatchResults.Where(m => !m.Confirmed && m.DatePlayed < DateTime.Now.AddDays(-14)));
            await db.SaveChangesAsync();

            var Id = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(Id!);

            string ReportedBy = user!.Id;
            int win = 0, lose = 0;
            for (int i = 0; i < p.Score.Length; i += 2)
            {
                if (p.Score[i] > p.Score[i + 1])
                    win++;
                if (p.Score[i] < p.Score[i + 1])
                    lose++;
            }
            string Winner1 = user.Id;
            string Loser1 = p.Opponent;
            string? Winner2 = p.Partner;
            string? Loser2 = p.Opponent2;
            if (lose > win)
            {
                //int temp;
                for (int i = 0; i < p.Score.Length; i += 2)
                {
                    (p.Score[i], p.Score[i + 1]) = (p.Score[i + 1], p.Score[i]);
                    //temp = p.Score[i];
                    //p.Score[i] = p.Score[i + 1];
                    //p.Score[i + 1] = temp;
                }
                Winner1 = p.Opponent;
                Loser1 = user.Id;
                Winner2 = p.Partner;
                Loser2 = p.Opponent2;
            }

            try
            {
                //var b = from m in db.MatchResults
                //where DateOnly.FromDateTime(match.DatePlayed).CompareTo(p.DatePlayed)==0
                //&& match.Winner1 == p.Winner1
                //&& match.Loser1 == p.Loser1
                ////&& match.Winner2 == p.Winner2
                ////&& match.Loser2 == p.Loser2
                //&& match.CompetitionName == p.CompetitionName
                //&& match.ReportedBy != ReportedBy
                //&& match.Confirmed == false
                //select m;

                //find other players' reported match result
                var match = db.MatchResults.Where(match =>
                        DateOnly.FromDateTime(match.DatePlayed).CompareTo(p.DatePlayed) == 0
                        && match.Winner1 == Winner1
                        && match.Loser1 == Loser1
                        //&& match.Winner2 == p.Winner2
                        //&& match.Loser2 == p.Loser2
                        && match.CompetitionName == p.CompetitionName
                        && match.ReportedBy != ReportedBy
                        && match.Confirmed == false
                //&& match.Score == p.Result
                ).FirstOrDefault();

                //not found, create new pending match
                if (match == null)
                {
                    //check for already reported unconfirmed result from this player
                    match = db.MatchResults.Where(match =>
                            DateOnly.FromDateTime(match.DatePlayed).CompareTo(p.DatePlayed) == 0
                            && match.Winner1 == Winner1
                            && match.Loser1 == Loser1
                            //&& match.Winner2 == p.Winner2
                            //&& match.Loser2 == p.Loser2
                            && match.CompetitionName == p.CompetitionName
                            && match.ReportedBy == ReportedBy
                            && match.Confirmed == false
                    //&& match.Score == p.Result
                    ).FirstOrDefault();
                    if (match != null)
                        return Ok("Pending");

                    MatchResult mr = new()
                    {
                        Id = System.Guid.NewGuid().ToString(),
                        Confirmed = false,
                        CompetitionName = p.CompetitionName,
                        DatePlayed = new DateTime(p.DatePlayed, new TimeOnly()),
                        Winner1 = Winner1,
                        Winner2 = Winner2,
                        Loser1 = Loser1,
                        Loser2 = Loser2,
                        Score = (int[])p.Score,
                        ReportedBy = ReportedBy
                    };
                    db.MatchResults.Add(mr);
                    await db.SaveChangesAsync();
                    return Ok("Pending");
                }
                else
                {
                    //update player ranks, swapping them with anyone in between
                    var winner = await _userManager.FindByIdAsync(match.Winner1);
                    var loser = await _userManager.FindByIdAsync(match.Loser1);
                    if (winner?.Rank > loser?.Rank) //winner lower ranked, move up
                    {
                        var higherPlayer = db.Users.Where(user => user.Rank == winner.Rank - 1).First();
                        higherPlayer.Rank++;
                        winner.Rank--;

                        await db.SaveChangesAsync();
                        if (higherPlayer != loser)
                        {
                            db.Users.Where(user => user.Rank == loser.Rank + 1).First().Rank--;
                            loser.Rank++;
                        }
                    }
                    match.Confirmed = true;
                    await db.SaveChangesAsync();
                    return Ok("Updated");
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return BadRequest(e.Message);
            }


            return Ok();

        }
    }
}
