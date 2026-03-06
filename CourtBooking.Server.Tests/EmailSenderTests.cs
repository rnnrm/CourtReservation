using Xunit;

namespace CourtBooking.Server.Tests;

public class EmailSenderTests
{
    [Fact]
    public void Constructor_DoesNotThrow()
    {
        // Instantiate using the fully-qualified type name to avoid lookup ambiguity.
        var sender = new global::CourtBooking.Server.EmailSender("smtp.test.local", "user", "pass");
        Assert.NotNull(sender);
    }
}