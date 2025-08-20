using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TripOrganizer.API.Models
{
    public class Trip
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Destination { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public decimal Price { get; set; }

        public string Description { get; set; } = string.Empty;

        // Trip capacity
        [Required]
        [Range(1, 100, ErrorMessage = "Capacity must be between 1 and 100")]
        public int Capacity { get; set; }

        // Owner (creator) relationship
        [Required]
        public string OwnerId { get; set; } = string.Empty;

        [ForeignKey("OwnerId")]
        public User Owner { get; set; } = null!;

        // List of participants 
        public List<User> Participants { get; set; } = new List<User>();

        // List of co-owners (users who can edit the trip)
        public List<User> CoOwners { get; set; } = new List<User>();

        // Helper methods
        [NotMapped]
        public int CurrentParticipantCount => Participants.Count;

        [NotMapped]
        public bool HasAvailableSpots => CurrentParticipantCount < Capacity;

        [NotMapped]
        public bool IsFutureTrip => StartDate > DateTime.UtcNow;

        public bool IsUserOwner(string userId) =>
            OwnerId == userId || CoOwners.Any(u => u.Id == userId);

        public bool IsUserParticipant(string userId) =>
            Participants.Any(p => p.Id == userId);

        // Concurrency token - using a string representation of last update time
        [ConcurrencyCheck]
        public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString();
    }
}