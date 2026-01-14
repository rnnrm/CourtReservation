
using System.Diagnostics.CodeAnalysis;
namespace CourtBooking.Server.Models
{
    public class Competitor
    {
        Competitor() { }

        [SetsRequiredMembers]
        public Competitor(string competition, string type, double rating, int? rank=0)
        {
            Id = System.Guid.NewGuid().ToString();
            Rating = rating;
            Rank = rank;
            Type = type;
            Competition = competition;
        }

        public required string Id { get; set; } = System.Guid.NewGuid().ToString();
        public required double Rating { get; set; } = 1500;
        public int? Rank { get; set; } = 0;
        public required string Type { get; set; } = "singles";
        public required string Competition { get; set; }
        public required ICollection<AppUser> Players { get; set; } = [];
    }
}
