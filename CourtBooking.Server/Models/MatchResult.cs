namespace CourtBooking.Server.Models
{
    public record MatchResultRequest(
        string Id,
        string CompetitionName,
        string Winner1,
        string? Winner2,
        string Loser1,
        string? Loser2,
        DateTime DatePlayed,
        string Score
    );

    public class MatchResult
    {
        public required string Id { get; set; } = System.Guid.NewGuid().ToString();
        public required string CompetitionName { get; set; }
        public required Competitor Winner { get; set; }
        public required Competitor Loser { get; set; }
        public required DateTime DatePlayed { get; set; } = DateTime.MinValue;
        public required int[] Score { get; set; }
        public double PointsChange { get; set; } = 0;
        public required bool Confirmed { get; set; } = false;
        public required Competitor ReportedBy { get; set; }

    }
}