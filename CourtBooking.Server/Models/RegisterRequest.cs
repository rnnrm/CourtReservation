
using System.ComponentModel.DataAnnotations;
namespace CourtBooking.Server.Models
{
    public class RegisterRequest
    {
        [Required]
        public required string? Name { get; set; }

        [Required]
        [EmailAddress]
        public string? Email { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public required string? Password { get; set; }

    }
}