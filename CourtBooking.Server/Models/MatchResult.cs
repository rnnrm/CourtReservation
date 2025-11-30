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
        public required string Winner1 { get; set; }
        public string? Winner2 { get; set; } = null;
        public required string Loser1 { get; set; }
        public string? Loser2 { get; set; } = null;
        public required DateTime DatePlayed { get; set; } = DateTime.MinValue;
        public required string Score { get; set; }
        public required bool Confirmed { get; set; } = false;
        public required string ReportedBy { get; set; }

    }
}