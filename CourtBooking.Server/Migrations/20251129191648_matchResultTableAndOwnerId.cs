using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Server.Migrations
{
    /// <inheritdoc />
    public partial class matchResultTableAndOwnerId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MatchResults",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    CompetitionName = table.Column<string>(type: "TEXT", nullable: false),
                    Winner1 = table.Column<string>(type: "TEXT", nullable: false),
                    Winner2 = table.Column<string>(type: "TEXT", nullable: true),
                    Loser1 = table.Column<string>(type: "TEXT", nullable: false),
                    Loser2 = table.Column<string>(type: "TEXT", nullable: true),
                    DatePlayed = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Score = table.Column<string>(type: "TEXT", nullable: false),
                    Confirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                    ReportedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchResults", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MatchResults");
        }
    }
}
