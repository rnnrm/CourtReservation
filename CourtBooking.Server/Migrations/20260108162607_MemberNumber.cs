using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Server.Migrations
{
    /// <inheritdoc />
    public partial class MemberNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MemberNumber",
                table: "AspNetUsers",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MemberNumber",
                table: "AspNetUsers");
        }
    }
}
