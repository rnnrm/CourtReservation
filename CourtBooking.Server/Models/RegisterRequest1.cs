namespace CourtBooking.Server.Models
{
    //
    // Summary:
    //     The request type for the "/register" endpoint added by Microsoft.AspNetCore.Routing.IdentityApiEndpointRouteBuilderExtensions.MapIdentityApi``1(Microsoft.AspNetCore.Routing.IEndpointRouteBuilder).
    public sealed class RegisterRequest1
    {
        //public RegisterRequest();

        //
        // Summary:
        //     The user's Username
        public required string Username { get; init; }
        //
        // Summary:
        //     The user's password.
        public required string Password { get; init; }
        public string? Email { get; init; }
    }
}