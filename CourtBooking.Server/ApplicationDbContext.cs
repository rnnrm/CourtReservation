using CourtBooking.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata;

namespace CourtBooking.Server
{

    public class ApplicationDbContext : IdentityDbContext<AppUser, IdentityRole, string> //IdentityUser
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) :
            base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Reservation>()
                .OwnsOne(p => p.ExtendedProps,
                eb => {
                    eb.Property(p => p.Owner).HasColumnName("ExtendedProps_Owner");
                    eb.Property(p => p.Court).HasColumnName("ExtendedProps_Court");
                });
        }
        
        public DbSet<Court> Courts { get; set; }
        public DbSet<Reservation> Reservations { get; set; }
    }
}
