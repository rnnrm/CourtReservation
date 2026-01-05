namespace CourtBooking.Server.Models
{
    [Microsoft.EntityFrameworkCore.Owned]
    public class ExtendedPropsObj
    {
        public ExtendedPropsObj() {} //just to prevent constructor deleting if another is added later  
        public required string Owner { get; set; }
        public required int Court { get; set; }
        public string? Description { get; set; } = null;
    }

    public class Reservation
    {
        public Reservation()
        {
            Id = System.Guid.NewGuid().ToString();
            Title = string.Empty;
            ExtendedProps = new ExtendedPropsObj { Owner = string.Empty, Court = 0 }; // ensure required members are set
        }
        public required string Id { get; set; }
        public required string Title { get; set; }
        public required ExtendedPropsObj ExtendedProps { get; set; }
        public bool? AllDay { get; set; } = null;
        public DateTimeOffset? Start { get; set; } = null;
        public DateTimeOffset? End { get; set; } = null;
        public DateTimeOffset? Date { get; set; } = null;
        public string? ClassName { get; set; } = null;
        public string? BackgroundColor { get; set; }
    }
}
