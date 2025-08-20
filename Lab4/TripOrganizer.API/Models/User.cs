using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace TripOrganizer.API.Models
{
    public class User : IdentityUser
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        // Trips this user created/owns
        public List<Trip> OwnedTrips { get; set; } = new List<Trip>();

        // Trips this user is participating in
        public List<Trip> ParticipatingTrips { get; set; } = new List<Trip>();

        // Trips where this user is a co-owner
        public List<Trip> CoOwnedTrips { get; set; } = new List<Trip>();
    }
}