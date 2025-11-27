using Microsoft.AspNetCore.Identity;

namespace CourtBooking.Server.Models
{
    public class AppUser : IdentityUser
    {
        public required int Rank { get; set; } = 9999;
    }
}
