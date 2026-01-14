using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Server.Migrations
{
    /// <inheritdoc />
    public partial class extendedProps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Court",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "Owner",
                table: "Reservations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Court",
                table: "Reservations",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Owner",
                table: "Reservations",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }
    }
}
