using CourtBooking.Server.Models;
using Microsoft.EntityFrameworkCore.Migrations;
using System.Collections.Generic;

#nullable disable

namespace CourtBooking.Server.Migrations
{
    /// <inheritdoc />
    public partial class multiComptetitorUserJoin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.CreateTable(
                name: "CompetitorPlayers",
                columns: table => new
                {
                    CompetitorId = table.Column<string>(type: "TEXT", nullable: false),
                    AppUserId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompetitorPlayers", x => new { x.CompetitorId, x.AppUserId });
                    table.ForeignKey(
                        name: "FK_CompetitorPlayers_AspNetUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompetitorPlayers_Competitors_CompetitorId",
                        column: x => x.CompetitorId,
                        principalTable: "Competitors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(@"INSERT INTO CompetitorPlayers(CompetitorId, AppUserId)
                                SELECT CompetitorId, Id FROM AspNetUsers WHERE CompetitorId IS NOT NULL;");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Competitors_CompetitorId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_CompetitorId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "CompetitorId",
                table: "AspNetUsers");
            migrationBuilder.CreateIndex(
                name: "IX_CompetitorPlayers_AppUserId",
                table: "CompetitorPlayers",
                column: "AppUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompetitorPlayers");

            migrationBuilder.AddColumn<string>(
                name: "CompetitorId",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: true);

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
        }
    }
}
