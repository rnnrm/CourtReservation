using CourtBooking.Server.Migrations;
using CourtBooking.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Numerics;
using System.Security.Claims;

namespace CourtBooking.Server.Controllers
{
    public record LadderResultParameters(string CompetitionName, string Opponent, int[] Score, DateOnly DatePlayed, string? Partner = null, string? Opponent2 = null);


    [Authorize(Roles = "Member,Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class LadderController : ControllerBase
    {

        private readonly UserManager<AppUser> _userManager;
        public LadderController([FromServices] UserManager<AppUser> userManager)
        {
            _userManager = userManager;
        }

        private static void UpdatePoints(MatchResult match)
        {
            var winner = match.Winner;
            var loser = match.Loser;
            double E = 1.0 / (1.0 + Math.Pow(10.0, (loser.Rating - winner.Rating) / 400.0));
            double k = 32;
            match.PointsChange = k * (1.0 - E);
            winner.Rating += match.PointsChange;
            loser.Rating -= match.PointsChange;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromServices] ApplicationDbContext db, [FromBody] LadderResultParameters p)
        {
            try {
                //prune unconfirmed matches older than 14 days
                db.MatchResults.RemoveRange(db.MatchResults.Where(m => !m.Confirmed && m.DatePlayed < DateTime.Now.AddDays(-14)));
                await db.SaveChangesAsync();

                var Id = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                var loggedInUser = await _userManager.FindByIdAsync(Id!);
                int win = 0, lose = 0;

                //calculate winner
                for (int i = 0; i < p.Score.Length; i += 2)
                {
                    if (p.Score[i] > p.Score[i + 1])
                        win++;
                    if (p.Score[i] < p.Score[i + 1])
                        lose++;
                }
                if (win==lose)
                    return BadRequest("Invalid score");

                bool doubles = !string.IsNullOrEmpty(p.Partner) && !string.IsNullOrEmpty(p.Opponent2);
                string Winner1 = loggedInUser.Id;
                string? Winner2 = p.Partner;
                string Loser1 = p.Opponent;
                string? Loser2 = p.Opponent2;
                if (lose > win)
                {
                    for (int i = 0; i < p.Score.Length; i += 2)
                    {                   
                        (p.Score[i], p.Score[i + 1]) = (p.Score[i + 1], p.Score[i]); //swap
                    }
                    Winner1 = p.Opponent;
                    Winner2 = p.Opponent2;
                    Loser1 = loggedInUser.Id;
                    Loser2 = p.Partner;
                }

                //find or create competitors
                var winners = db.Competitors.Where(c =>
                    c.Competition == p.CompetitionName
                    && c.Players.Any(pl => pl.Id == Winner1)
                    && (!doubles || c.Players.Any(pl => pl.Id == Winner2)) //short circuit evaluation
                ).FirstOrDefault();

                if (winners == null)
                {
                    string type = doubles ? "doubles" : "singles";
                    winners = new Competitor(p.CompetitionName, type, 1500);
                    winners.Players.Add(await _userManager.FindByIdAsync(Winner1));
                    if (doubles)
                        winners.Players.Add(await _userManager.FindByIdAsync(Winner2));
                    db.Competitors.Add(winners);
                }

                var losers = db.Competitors.Where(c =>
                    c.Competition == p.CompetitionName
                    && c.Players.Any(pl => pl.Id == Loser1)
                    && (!doubles || c.Players.Any(pl => pl.Id == Loser2))
                ).FirstOrDefault();

                if (losers == null)
                {
                    string type = doubles ? "doubles" : "singles";
                    losers = new Competitor(p.CompetitionName, type, 1500);
                    losers.Players.Add(await _userManager.FindByIdAsync(Loser1));
                    if (doubles)
                        losers.Players.Add(await _userManager.FindByIdAsync(Loser2));
                    db.Competitors.Add(losers);
                }
                await db.SaveChangesAsync();

                //determine who reported
                var ReportedBy = winners;
                if (lose > win)
                    ReportedBy = losers;
        /*        Console.WriteLine($"p.Partner: {p.Partner}, winners {winners.Id}, Losers: {losers.Id}");
                var ReportedBy = db.Competitors.Where(c =>
                    c.Competition.ToLower() == p.CompetitionName.ToLower()
                    && c.Players.Any(pl => pl.Id == loggedInUser.Id)
                    && (!doubles || c.Players.Any(pl => pl.Id == p.Partner))
                ).First();*/

                //find other players' reported match result
                var match = db.MatchResults.Where(match =>
                        DateOnly.FromDateTime(match.DatePlayed).CompareTo(p.DatePlayed) == 0
                        && match.Winner == winners
                        && match.Loser == losers
                        && match.CompetitionName == p.CompetitionName
                        && match.ReportedBy != ReportedBy
                        && match.Confirmed == false
                //&& match.Score == p.esult
                ).FirstOrDefault();

                //not found, create new pending match
                if (match == null)
                {
                    //check for already reported unconfirmed result from this player to update
                    match = db.MatchResults.Where(match =>
                            DateOnly.FromDateTime(match.DatePlayed).CompareTo(p.DatePlayed) == 0
                            && match.Winner == winners
                            && match.Loser == losers
                            && match.CompetitionName == p.CompetitionName
                            && match.ReportedBy == ReportedBy
                            && match.Confirmed == false
                    //&& match.Score == p.Result
                    ).FirstOrDefault();
                    if (match != null)
                    {
                        //delete it and store new one
                        db.MatchResults.Remove(match);
                    }

                    MatchResult mr = new()
                    {
                        Id = System.Guid.NewGuid().ToString(),
                        Confirmed = false,
                        CompetitionName = p.CompetitionName,
                        DatePlayed = new DateTime(p.DatePlayed, new TimeOnly()),
                        Winner = winners,
                        Loser = losers,
                        Score = (int[])p.Score,
                        ReportedBy = ReportedBy
                    };
                    db.MatchResults.Add(mr);
                    await db.SaveChangesAsync();
                    return Ok("Pending");
                }
                else
                {
                    match.Confirmed = true;
                    match.Loser.MatchesPlayed++;
                    match.Winner.MatchesPlayed++;
                    UpdatePoints(match);
                    await db.SaveChangesAsync();
                    return Ok("Updated");
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return BadRequest(e.Message);
            }
        }

        private static async Task ChangeRank(MatchResult match, ApplicationDbContext db)
        {
            //update player ranks, swapping them with anyone in between
            var winner = match.Winner;
            var loser = match.Loser;
            if (winner?.Rank > loser?.Rank) //winner lower ranked, move up
            {
                var higherPlayer = db.Competitors.Where(c => (c.Rank == winner.Rank - 1) && (c.Competition == winner.Competition)).First();
                higherPlayer.Rank++;
                winner.Rank--;

                await db.SaveChangesAsync();
                if (higherPlayer != loser)
                {
                    db.Competitors.Where(c => (c.Rank == loser.Rank + 1) && (c.Competition == loser.Competition)).First().Rank--;
                    loser.Rank++;
                }
            }
        }

        //get all competitors
        [AllowAnonymous]
        [HttpGet("Competitors")]
        public IActionResult GetCompetitors([FromServices] ApplicationDbContext db, string competitionName)
        {
            var competitors = db.Competitors.Where(c => c.Competition == competitionName)
                .Select(c => new
                {
                    c.Id,
                    Rating = Math.Round(c.Rating),
                    c.Rank,
                    c.Type,
                    Players = c.Players.Select(p => new { p.Id, p.UserName })
                }).OrderByDescending(c => c.Rating);
            return Ok(competitors);
        }

        [HttpGet("PendingResults")]
        public IActionResult GetPendingResults([FromServices] ApplicationDbContext db, [FromQuery] string competitionName)
        {
            var Id = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var loggedInUser =  _userManager.FindByIdAsync(Id!).Result!;
            var matches = db.MatchResults.Where(m => !m.Confirmed &&
            (m.CompetitionName == competitionName) &&
            (m.Winner.Players.Any(p => p.Id == loggedInUser.Id) ||
            m.Loser.Players.Any(p => p.Id == loggedInUser.Id)))
                .Select(m => new
                {
                    m.Id,
                    Winner1 = m.Winner.Players.First().UserName,
                    Winner2 = m.Winner.Type == "doubles" ? m.Winner.Players.Skip(1).First().UserName : null,
                    Loser1 = m.Loser.Players.First().UserName,
                    Loser2 = m.Loser.Type == "doubles" ? m.Loser.Players.Skip(1).First().UserName : null,
                    Score = FormatScore(m.Score),
                    DatePlayed = m.DatePlayed.ToShortDateString(),
                    m.CompetitionName,
                    ReportedBy = m.ReportedBy.Players.Count > 1 ? 
                        m.ReportedBy.Players.First().UserName +" & "+ m.ReportedBy.Players.Skip(1).First().UserName : 
                        m.ReportedBy.Players.First().UserName                    
                }
            );
            return Ok(matches);
        }

        //get recent match results for competition
        [AllowAnonymous]
        [HttpGet("Results")]
        public IActionResult GetResults([FromServices] ApplicationDbContext db, [FromQuery] string competitionName)
        {

            if (string.IsNullOrWhiteSpace(competitionName))
                return BadRequest("competitionName is required.");

            var matches = db.MatchResults.Where(m => m.Confirmed && 
            (m.CompetitionName == competitionName))
                .OrderByDescending(m => m.DatePlayed)
                .Take(50)
                .Select(m => new
            {
                Winner1 = m.Winner.Players.First().UserName,
                Winner2 = m.Winner.Type == "doubles" ? m.Winner.Players.Skip(1).First().UserName : null,
                Loser1 = m.Loser.Players.First().UserName,
                Loser2 = m.Loser.Type == "doubles" ? m.Loser.Players.Skip(1).First().UserName : null,
                Score = FormatScore(m.Score),
                DatePlayed = m.DatePlayed.ToShortDateString(),
                PointsChange = Math.Round(m.PointsChange, 1)
                }
            );

  /*          var nameLower = competitionName.ToLowerInvariant();

            // Project only simple, translatable fields and player lists, then materialize.
            var projected = await db.MatchResults
                .Where(m => m.Confirmed && m.CompetitionName != null && m.CompetitionName.ToLower() == nameLower)
                .OrderByDescending(m => m.DatePlayed)
                .Take(5)
                .Select(m => new
                {
                    WinnerUserNames = m.Winner.Players.Select(p => p.UserName).ToArray(),
                    LoserUserNames = m.Loser.Players.Select(p => p.UserName).ToArray(),
                    WinnerType = m.Winner.Type,
                    LoserType = m.Loser.Type,
                    m.Score,
                    m.DatePlayed,
                    m.PointsChange
                })
                .ToListAsync();

            var match = projected.Select(m => new
            {
                Winner1 = m.WinnerUserNames.FirstOrDefault(),
                Winner2 = string.Equals(m.WinnerType, "Doubles", StringComparison.OrdinalIgnoreCase) ? m.WinnerUserNames.Skip(1).FirstOrDefault() : null,
                Loser1 = m.LoserUserNames.FirstOrDefault(),
                Loser2 = string.Equals(m.LoserType, "Doubles", StringComparison.OrdinalIgnoreCase) ? m.LoserUserNames.Skip(1).FirstOrDefault() : null,
                Score = FormatScore(m.Score),
                DatePlayed = m.DatePlayed.ToShortDateString(),
                PointsChange = Math.Round(m.PointsChange, 1)
            });*/


            return Ok(matches);
        }

        //return score as string
        private static string FormatScore(int[] score)
        {
            if (score[0] == score[1])
                return "0-0"; //invalid score
            string s = score[0] + "-" + score[1];
            for (int i = 2; i < score.Length; i+=2)
            {
                if (score[i] == score[i + 1]) continue;
                s += ","+score[i]+"-"+score[i + 1];
            }
            return s;
        }
    }
}
