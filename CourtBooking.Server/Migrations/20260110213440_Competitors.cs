using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Server.Migrations
{
    /// <inheritdoc />
    public partial class Competitors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Competitors",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Rating = table.Column<double>(type: "REAL", nullable: false),
                    Rank = table.Column<int>(type: "INTEGER", nullable: true),
                    Type = table.Column<string>(type: "TEXT", nullable: false),
                    Competition = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Competitors", x => x.Id);
                });
            migrationBuilder.DropColumn(
                name: "Loser2",
                table: "MatchResults");

            migrationBuilder.DropColumn(
                name: "Winner2",
                table: "MatchResults");

            migrationBuilder.DropColumn(
                name: "Rank",
                table: "AspNetUsers");

            migrationBuilder.RenameColumn(
                name: "Winner1",
                table: "MatchResults",
                newName: "WinnerId");

            migrationBuilder.RenameColumn(
                name: "Loser1",
                table: "MatchResults",
                newName: "LoserId");

            migrationBuilder.AddColumn<double>(
                name: "PointsChange",
                table: "MatchResults",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "CompetitorId",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: true);

            // Ensure any referenced competitor Ids in existing MatchResults are present
            // before adding foreign keys. We insert minimal "placeholder" rows for any
            // WinnerId/LoserId values not already present in Competitors.
            migrationBuilder.Sql(@"
            INSERT INTO Competitors (Id, Rating, Rank, Type, Competition)
            SELECT DISTINCT v.Id, 1500.0, NULL, 'singles', 'Singles ladder'
            FROM (
                SELECT WinnerId AS Id FROM MatchResults
                UNION
                SELECT LoserId AS Id FROM MatchResults
            ) v
            WHERE v.Id IS NOT NULL
              AND v.Id NOT IN (SELECT Id FROM Competitors);
            ");


            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_LoserId",
                table: "MatchResults",
                column: "LoserId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_WinnerId",
                table: "MatchResults",
                column: "WinnerId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_CompetitorId",
                table: "AspNetUsers",
                column: "CompetitorId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Competitors_CompetitorId",
                table: "AspNetUsers",
                column: "CompetitorId",
                principalTable: "Competitors",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MatchResults_Competitors_LoserId",
                table: "MatchResults",
                column: "LoserId",
                principalTable: "Competitors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MatchResults_Competitors_WinnerId",
                table: "MatchResults",
                column: "WinnerId",
                principalTable: "Competitors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Competitors_CompetitorId",
                table: "AspNetUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_MatchResults_Competitors_LoserId",
                table: "MatchResults");

            migrationBuilder.DropForeignKey(
                name: "FK_MatchResults_Competitors_WinnerId",
                table: "MatchResults");

            migrationBuilder.DropTable(
                name: "Competitors");

            migrationBuilder.DropIndex(
                name: "IX_MatchResults_LoserId",
                table: "MatchResults");

            migrationBuilder.DropIndex(
                name: "IX_MatchResults_WinnerId",
                table: "MatchResults");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_CompetitorId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "PointsChange",
                table: "MatchResults");

            migrationBuilder.DropColumn(
                name: "CompetitorId",
                table: "AspNetUsers");

            migrationBuilder.RenameColumn(
                name: "WinnerId",
                table: "MatchResults",
                newName: "Winner1");

            migrationBuilder.RenameColumn(
                name: "LoserId",
                table: "MatchResults",
                newName: "Loser1");

            migrationBuilder.AddColumn<string>(
                name: "Loser2",
                table: "MatchResults",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Winner2",
                table: "MatchResults",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Rank",
                table: "AspNetUsers",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }
    }
}
