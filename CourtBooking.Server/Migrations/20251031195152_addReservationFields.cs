using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Server.Migrations
{
    /// <inheritdoc />
    public partial class addReservationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "title",
                table: "Reservations",
                newName: "Title");

            migrationBuilder.RenameColumn(
                name: "start",
                table: "Reservations",
                newName: "Start");

            migrationBuilder.RenameColumn(
                name: "end",
                table: "Reservations",
                newName: "End");

            migrationBuilder.RenameColumn(
                name: "date",
                table: "Reservations",
                newName: "Date");

            migrationBuilder.RenameColumn(
                name: "allDay",
                table: "Reservations",
                newName: "AllDay");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Reservations",
                newName: "Id");

            migrationBuilder.AlterColumn<string>(
                name: "Start",
                table: "Reservations",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AlterColumn<string>(
                name: "End",
                table: "Reservations",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AlterColumn<string>(
                name: "Date",
                table: "Reservations",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AlterColumn<bool>(
                name: "AllDay",
                table: "Reservations",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "INTEGER");

            migrationBuilder.AddColumn<string>(
                name: "ClassName",
                table: "Reservations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Reservations",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClassName",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Reservations");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "Reservations",
                newName: "title");

            migrationBuilder.RenameColumn(
                name: "Start",
                table: "Reservations",
                newName: "start");

            migrationBuilder.RenameColumn(
                name: "End",
                table: "Reservations",
                newName: "end");

            migrationBuilder.RenameColumn(
                name: "Date",
                table: "Reservations",
                newName: "date");

            migrationBuilder.RenameColumn(
                name: "AllDay",
                table: "Reservations",
                newName: "allDay");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Reservations",
                newName: "id");

            migrationBuilder.AlterColumn<string>(
                name: "start",
                table: "Reservations",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "end",
                table: "Reservations",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "date",
                table: "Reservations",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "allDay",
                table: "Reservations",
                type: "INTEGER",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "INTEGER",
                oldNullable: true);
        }
    }
}
