using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TripOrganizer.API.Models;

namespace TripOrganizer.API.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Trip> Trips { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure Trip-User relationships
            builder.Entity<Trip>()
                .HasOne(t => t.Owner)
                .WithMany(u => u.OwnedTrips)
                .HasForeignKey(t => t.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Trip>()
                .HasMany(t => t.Participants)
                .WithMany(u => u.ParticipatingTrips);

            builder.Entity<Trip>()
                .HasMany(t => t.CoOwners)
                .WithMany(u => u.CoOwnedTrips);
        }
    }
}