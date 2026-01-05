
using System.ComponentModel.DataAnnotations;
    namespace CourtBooking.Server.Models
{
    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        public string? Email { get; set; }

        [Required]
        public required string Name { get; set; }

        [Required]
        public required string Password { get; set; }
    }

}
        