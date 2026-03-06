using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CourtBooking.Server;
using CourtBooking.Server.Controllers;
using CourtBooking.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CourtBooking.Server.Tests;

public class BookingsControllerTests
{
    private static ApplicationDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Post_AddsReservationToDatabase()
    {
        var dbName = $"Post_AddsReservation_{Guid.NewGuid()}";
        await using var context = CreateContext(dbName);

        var controller = new BookingsController(context);

        var reservation = new Reservation
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Test Reservation",
            ExtendedProps = new ExtendedPropsObj { Owner = "user-1", Court = 1 },
            Date = DateTimeOffset.UtcNow
        };

        var postResult = await controller.Post(reservation);

        // Verify saved in DB
        var saved = await context.Reservations.FindAsync(reservation.Id);
        Assert.NotNull(saved);
        Assert.Equal("Test Reservation", saved!.Title);
        Assert.Equal(1, saved.ExtendedProps.Court);
        Assert.Equal("user-1", saved.ExtendedProps.Owner);
    }

    [Fact]
    public async Task Get_ReturnsReservationsForGivenCourt()
    {
        var dbName = $"Get_ReturnsReservations_{Guid.NewGuid()}";
        await using var context = CreateContext(dbName);

        // Seed two reservations on different courts
        var r1 = new Reservation
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Court1",
            ExtendedProps = new ExtendedPropsObj { Owner = "a", Court = 1 },
            Date = DateTimeOffset.UtcNow
        };
        var r2 = new Reservation
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Court2",
            ExtendedProps = new ExtendedPropsObj { Owner = "b", Court = 2 },
            Date = DateTimeOffset.UtcNow
        };

        context.Reservations.AddRange(r1, r2);
        await context.SaveChangesAsync();

        var controller = new BookingsController(context);

        // Request reservations for court 1
        var actionResult = await controller.Get(null, null, 1);

        var ok = Assert.IsType<OkObjectResult>(actionResult.Result);
        var list = Assert.IsAssignableFrom<IEnumerable<Reservation>>(ok.Value);
        var items = list.ToList();

        Assert.Single(items);
        Assert.Equal("Court1", items[0].Title);
        Assert.Equal(1, items[0].ExtendedProps.Court);
    }
}