using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Server.Migrations
{
    /// <inheritdoc />
    public partial class Movedescriptiontoextenededprops : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Reservations",
                newName: "ExtendedProps_Description");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ExtendedProps_Description",
                table: "Reservations",
                newName: "Description");
        }
    }
}
