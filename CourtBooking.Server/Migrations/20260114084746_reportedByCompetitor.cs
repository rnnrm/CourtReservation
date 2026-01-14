using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Server.Migrations
{
    /// <inheritdoc />
    public partial class reportedByCompetitor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ReportedBy",
                table: "MatchResults",
                newName: "ReportedById");

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_ReportedById",
                table: "MatchResults",
                column: "ReportedById");

            migrationBuilder.AddForeignKey(
                name: "FK_MatchResults_Competitors_ReportedById",
                table: "MatchResults",
                column: "ReportedById",
                principalTable: "Competitors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MatchResults_Competitors_ReportedById",
                table: "MatchResults");

            migrationBuilder.DropIndex(
                name: "IX_MatchResults_ReportedById",
                table: "MatchResults");

            migrationBuilder.RenameColumn(
                name: "ReportedById",
                table: "MatchResults",
                newName: "ReportedBy");
        }
    }
}
