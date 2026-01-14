using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Server.Migrations
{
    /// <inheritdoc />
    public partial class courtReservationField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Court",
                table: "Reservations",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Court",
                table: "Reservations");
        }
    }
}
