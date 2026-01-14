using Microsoft.AspNetCore.Identity;

namespace CourtBooking.Server.Models
{
    public class AppUser : IdentityUser
    {
        public int? MemberNumber { get; set; }
        public ICollection<Competitor> Competitions { get; set; } = [];
    }
}
