using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using CourtBooking.Server;
using CourtBooking.Server.Controllers;
using CourtBooking.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace CourtBooking.Server.Tests
{
    // Helpers to provide an IQueryable that implements IAsyncEnumerable so EF Core's ToListAsync works in tests
    internal class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
    {
        private readonly IEnumerator<T> _enumerator;
        public TestAsyncEnumerator(IEnumerator<T> enumerator) => _enumerator = enumerator;
        public ValueTask DisposeAsync() { _enumerator.Dispose(); return default; }
        public ValueTask<bool> MoveNextAsync() => new ValueTask<bool>(_enumerator.MoveNext());
        public T Current => _enumerator.Current;
    }

    internal class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
    {
        public TestAsyncEnumerable(IEnumerable<T> enumerable) : base(enumerable) { }
        public TestAsyncEnumerable(Expression expression) : base(expression) { }

        public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
        {
            return new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
        }
    }

    public class UsersControllerTests
    {
        private Mock<UserManager<AppUser>> CreateMockUserManager(IEnumerable<AppUser>? users = null)
        {
            var store = new Mock<IUserStore<AppUser>>();
            var mgr = new Mock<UserManager<AppUser>>(
                store.Object, null, null, null, null, null, null, null, null);

            var usersList = (users ?? Array.Empty<AppUser>()).ToList();
            // Return an IQueryable that also implements IAsyncEnumerable to satisfy EF Core's async methods in controller
            mgr.SetupGet(m => m.Users).Returns(new TestAsyncEnumerable<AppUser>(usersList));

            // default behaviors - individual tests may override
            mgr.Setup(m => m.FindByIdAsync(It.IsAny<string>()))
               .ReturnsAsync((string id) => usersList.FirstOrDefault(u => u.Id == id));
            mgr.Setup(m => m.GetRolesAsync(It.IsAny<AppUser>()))
               .ReturnsAsync((AppUser u) => new List<string>());
            mgr.Setup(m => m.IsInRoleAsync(It.IsAny<AppUser>(), It.IsAny<string>()))
               .ReturnsAsync(false);
            mgr.Setup(m => m.UpdateAsync(It.IsAny<AppUser>()))
               .ReturnsAsync(IdentityResult.Success);
            mgr.Setup(m => m.AddToRoleAsync(It.IsAny<AppUser>(), It.IsAny<string>()))
               .ReturnsAsync(IdentityResult.Success);
            mgr.Setup(m => m.RemoveFromRoleAsync(It.IsAny<AppUser>(), It.IsAny<string>()))
               .ReturnsAsync(IdentityResult.Success);
            mgr.Setup(m => m.DeleteAsync(It.IsAny<AppUser>()))
               .ReturnsAsync(IdentityResult.Success);

            return mgr;
        }

        private Mock<RoleManager<IdentityRole>> CreateMockRoleManager()
        {
            var store = new Mock<IRoleStore<IdentityRole>>();
            var mgr = new Mock<RoleManager<IdentityRole>>(
                store.Object, null, null, null, null);
            mgr.Setup(m => m.FindByNameAsync(It.IsAny<string>()))
               .ReturnsAsync((string name) => new IdentityRole(name));
            return mgr;
        }

        private ApplicationDbContext CreateInMemoryDb(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;
            var db = new ApplicationDbContext(options);
            db.Database.EnsureDeleted();
            db.Database.EnsureCreated();
            return db;
        }

        [Fact]
        public async Task Get_ReturnsAllUsers_AsDictionary()
        {
            // Arrange
            var u1 = new AppUser { Id = "u1", UserName = "Alice", MemberNumber = 10 };
            var u2 = new AppUser { Id = "u2", UserName = "Bob", MemberNumber = null };
            var users = new List<AppUser> { u1, u2 };

            var mockUserManager = CreateMockUserManager(users);
            mockUserManager.Setup(m => m.GetRolesAsync(u1)).ReturnsAsync(new List<string> { "Member" });
            mockUserManager.Setup(m => m.GetRolesAsync(u2)).ReturnsAsync(new List<string>());

            var mockRoleManager = CreateMockRoleManager();
            var db = CreateInMemoryDb(nameof(Get_ReturnsAllUsers_AsDictionary));

            var controller = new UsersController(mockUserManager.Object, mockRoleManager.Object, db);

            // Act
            var actionResult = await controller.Get();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            var dict = Assert.IsType<Dictionary<string, UserViewModel>>(okResult.Value);
            Assert.Equal(2, dict.Count);
            Assert.True(dict.ContainsKey("u1"));
            Assert.Equal("Alice", dict["u1"].Name);
            Assert.Equal(new[] { "Member" }, dict["u1"].Roles);
        }

        [Fact]
        public async Task SetMemberNumber_FindsUser_SetsMemberNumber_Updates()
        {
            // Arrange
            var user = new AppUser { Id = "u1", UserName = "Alice", MemberNumber = null };
            var mockUserManager = CreateMockUserManager(new[] { user });
            var mockRoleManager = CreateMockRoleManager();
            var db = CreateInMemoryDb(nameof(SetMemberNumber_FindsUser_SetsMemberNumber_Updates));

            var controller = new UsersController(mockUserManager.Object, mockRoleManager.Object, db);

            // Act
            var result = await controller.SetMemberNumber(new UsersController.MembernumParameters
            {
                Id = "u1",
                MemberNumber = 123
            });

            // Assert
            Assert.IsType<OkResult>(result);
            Assert.Equal(123, user.MemberNumber);
            mockUserManager.Verify(m => m.UpdateAsync(user), Times.Once);
        }

        [Fact]
        public async Task Patch_RemoveRole_WhenUserInRole_CallsRemoveFromRole()
        {
            // Arrange
            var user = new AppUser { Id = "u1", UserName = "Alice", MemberNumber = 1 };
            var mockUserManager = CreateMockUserManager(new[] { user });
            mockUserManager.Setup(m => m.IsInRoleAsync(user, "Admin")).ReturnsAsync(true);
            var mockRoleManager = CreateMockRoleManager();
            var db = CreateInMemoryDb(nameof(Patch_RemoveRole_WhenUserInRole_CallsRemoveFromRole));

            var controller = new UsersController(mockUserManager.Object, mockRoleManager.Object, db);

            // Act
            var result = await controller.Patch(new UsersController.RoleParameters { Id = "u1", Role = "Admin" });

            // Assert
            Assert.IsType<OkResult>(result);
            mockUserManager.Verify(m => m.RemoveFromRoleAsync(user, "Admin"), Times.Once);
        }

        [Fact]
        public async Task Patch_AddMember_AssignsMemberNumber_WhenNull()
        {
            // Arrange
            // Pre-seed database with existing users to calculate max member number
            var db = CreateInMemoryDb(nameof(Patch_AddMember_AssignsMemberNumber_WhenNull));
            db.Users.AddRange(
                new AppUser { Id = "uA", UserName = "Existing1", MemberNumber = 5 },
                new AppUser { Id = "uB", UserName = "Existing2", MemberNumber = 7 }
            );
            await db.SaveChangesAsync();

            var user = new AppUser { Id = "uNew", UserName = "NewUser", MemberNumber = null };
            var mockUserManager = CreateMockUserManager(new[] { user });
            var mockRoleManager = CreateMockRoleManager();

            var controller = new UsersController(mockUserManager.Object, mockRoleManager.Object, db);

            // Act
            var result = await controller.Patch(new UsersController.RoleParameters { Id = "uNew", Role = "Member" });

            // Assert
            Assert.IsType<OkResult>(result);
            // MemberNumber should be max existing (7) + 1 = 8
            Assert.Equal(8, user.MemberNumber);
            mockUserManager.Verify(m => m.UpdateAsync(user), Times.Once);
        }

        [Fact]
        public async Task Delete_RemovesUserAndReservations_ReturnsOk()
        {
            // Arrange
            var db = CreateInMemoryDb(nameof(Delete_RemovesUserAndReservations_ReturnsOk));
            var user = new AppUser { Id = "u1", UserName = "ToDelete" };
            db.Users.Add(user);
            db.Reservations.Add(new Reservation
            {
                Id = "r1",
                Title = "Res1",
                ExtendedProps = new ExtendedPropsObj { Owner = "u1", Court = 1 }
            });
            db.Reservations.Add(new Reservation
            {
                Id = "r2",
                Title = "Res2",
                ExtendedProps = new ExtendedPropsObj { Owner = "other", Court = 2 }
            });
            await db.SaveChangesAsync();

            var mockUserManager = CreateMockUserManager(new[] { user });
            mockUserManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
            mockUserManager.Setup(m => m.DeleteAsync(user)).ReturnsAsync(IdentityResult.Success);

            var mockRoleManager = CreateMockRoleManager();

            var controller = new UsersController(mockUserManager.Object, mockRoleManager.Object, db);

            // Act
            var result = await controller.Delete("u1");

            // Assert
            Assert.IsType<OkResult>(result);
            // Ensure reservation for owner was removed
            var remaining = db.Reservations.ToList();
            Assert.Single(remaining);
            Assert.Equal("r2", remaining[0].Id);
            mockUserManager.Verify(m => m.DeleteAsync(user), Times.Once);
        }

        [Fact]
        public async Task Delete_ReturnsNotFound_WhenUserMissing()
        {
            // Arrange
            var db = CreateInMemoryDb(nameof(Delete_ReturnsNotFound_WhenUserMissing));
            var mockUserManager = CreateMockUserManager();
            mockUserManager.Setup(m => m.FindByIdAsync("doesnotexist")).ReturnsAsync((AppUser?)null);
            var mockRoleManager = CreateMockRoleManager();

            var controller = new UsersController(mockUserManager.Object, mockRoleManager.Object, db);

            // Act
            var result = await controller.Delete("doesnotexist");

            // Assert
            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("User not found", notFound.Value);
        }
    }
}