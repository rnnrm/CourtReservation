using CourtBooking.Server.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Text.RegularExpressions;
using static CourtBooking.Server.Controllers.UsersController;

namespace CourtBooking.Server.Controllers
{


    public record LadderResultParameters(string CompetitionName, string Winner1, string Loser1,   string Result, DateTime DatePlayed, string ReportedBy, string? Winner2=null, string? Loser2=null);

    [Route("api/[controller]")]
    [ApiController]
    public class LadderController : ControllerBase
    {

        // PUT api/<Users>/role
        [HttpPost("ladder")]
        public async Task<IActionResult> Post([FromServices] UserManager<AppUser> _userManager, [FromServices] ApplicationDbContext db, [FromBody] LadderResultParameters p)
        {
            //prune unconfirmed matches older than 7 days
            db.MatchResults.RemoveRange(db.MatchResults.Where(m => !m.Confirmed && m.DatePlayed < DateTime.Now.AddDays(-7)));
            await db.SaveChangesAsync();

            try { 
                DateOnly today = new DateOnly();
                //var b = from match in db.MatchResults
                //where DateOnly.FromDateTime(match.DatePlayed).Equals(today)
                //&& match.Winner1 == p.Winner1
                //&& match.Loser1 == p.Loser1
                //&& match.Winner2 == p.Winner2
                //&& match.Loser2 == p.Loser2
                //select top 1 match;

                //find other players' reported match result
                var match = db.MatchResults.Where(match =>
                        DateOnly.FromDateTime(match.DatePlayed).Equals(DateOnly.FromDateTime(p.DatePlayed))
                        && match.Winner1 == p.Winner1
                        && match.Loser1 == p.Loser1
                        //&& match.Winner2 == p.Winner2
                        //&& match.Loser2 == p.Loser2
                        && match.CompetitionName == p.CompetitionName
                        && match.ReportedBy != p.ReportedBy
                        //&& match.Score == p.Result
                ).First();

                //not found, create new pending match
                if (match == null)
                {
                    MatchResult mr = new()
                    {
                        Id = System.Guid.NewGuid().ToString(),
                        Confirmed = false,
                        CompetitionName = p.CompetitionName,
                        DatePlayed = p.DatePlayed,
                        Winner1 = p.Winner1,
                        //Winner2 = p.Winner2,
                        Loser1 = p.Loser1,
                        //Loser2 = p.Loser2,
                        Score = p.Result,
                        ReportedBy = p.ReportedBy
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
                    if (winner?.Rank < loser?.Rank)
                    {
                        var higherPlayer = db.Users.Where(user => user.Rank == winner.Rank + 1).First();
                        higherPlayer.Rank--;
                        winner.Rank++;

                        if (higherPlayer != loser)
                        {
                            db.Users.Where(user => user.Rank == loser.Rank - 1).First().Rank++;
                            loser.Rank--;
                        }
                    }
                    match.Confirmed = true;
                    return Ok("Updated");
                }
            }
            catch (Exception e)
            {
            }


            return Ok();

        }
    }
}
