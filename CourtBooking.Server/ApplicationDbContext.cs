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
                eb =>
                {
                    eb.Property(p => p.Owner).HasColumnName("ExtendedProps_Owner");
                    eb.Property(p => p.Court).HasColumnName("ExtendedProps_Court");
                });
            // Minimal Competitor configuration:
            modelBuilder.Entity<Competitor>(cb =>
            {
                cb.HasKey(c => c.Id);                   // explicit primary key
                cb.Property(c => c.Competition).IsRequired();
                cb.Property(c => c.Type).IsRequired();
                cb.Property(c => c.Rating).IsRequired();

                // Leave Players as a navigation collection; EF Core will create
                // a many-to-many join table by convention (shadow entity).
                // If you generate Id in code (recommended), mark it ValueGeneratedNever:
                cb.Property(c => c.Id).ValueGeneratedNever();
            });


            // Explicit many-to-many between Competitor and AppUser using a join table
            modelBuilder.Entity<Competitor>()
                .HasMany(c => c.Players)
                .WithMany(u => u.Competitions)
                .UsingEntity<Dictionary<string, object>>(
                    "CompetitorPlayers",
                    j => j.HasOne<AppUser>()
                          .WithMany()
                          .HasForeignKey("AppUserId")
                          .HasConstraintName("FK_CompetitorPlayers_AspNetUsers_AppUserId")
                          .OnDelete(DeleteBehavior.Cascade),
                    j => j.HasOne<Competitor>()
                          .WithMany()
                          .HasForeignKey("CompetitorId")
                          .HasConstraintName("FK_CompetitorPlayers_Competitors_CompetitorId")
                          .OnDelete(DeleteBehavior.Cascade),
                    je =>
                    {
                        je.HasKey("CompetitorId", "AppUserId");
                        je.ToTable("CompetitorPlayers");
                        je.HasIndex("AppUserId");
                    });
        }

        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<MatchResult> MatchResults { get; set; }
        public DbSet<Competitor> Competitors { get; set; }
    }
}
