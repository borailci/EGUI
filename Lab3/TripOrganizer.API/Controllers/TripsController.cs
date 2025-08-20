using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TripOrganizer.API.Data;
using TripOrganizer.API.Models;

namespace TripOrganizer.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TripsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;

        public TripsController(ApplicationDbContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet]
        [HttpGet("future")]
        public async Task<IActionResult> GetFutureTrips()
        {
            var trips = await _context.Trips
                .Include(t => t.Owner)
                .Include(t => t.Participants)
                .Include(t => t.CoOwners)
                .Where(t => t.StartDate > DateTime.UtcNow)
                .ToListAsync();

            return Ok(trips);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTrip([FromBody] CreateTripModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var trip = new Trip
            {
                Name = model.Name,
                Destination = model.Destination,
                StartDate = model.StartDate,
                EndDate = model.EndDate,
                Price = model.Price,
                Description = model.Description,
                Capacity = model.Capacity,
                OwnerId = user.Id,
                Participants = new List<User> { user }
            };

            _context.Trips.Add(trip);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTrip), new { id = trip.Id }, trip);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTrip(int id)
        {
            var trip = await _context.Trips
                .Include(t => t.Owner)
                .Include(t => t.Participants)
                .Include(t => t.CoOwners)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trip == null)
                return NotFound();

            return Ok(trip);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTrip(int id, [FromBody] UpdateTripModel model)
        {
            var trip = await _context.Trips
                .Include(t => t.CoOwners)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trip == null)
                return NotFound();

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            if (!trip.IsUserOwner(user.Id))
                return Forbid();

            trip.Name = model.Name;
            trip.Destination = model.Destination;
            trip.StartDate = model.StartDate;
            trip.EndDate = model.EndDate;
            trip.Price = model.Price;
            trip.Description = model.Description;
            trip.Capacity = model.Capacity;
            trip.ConcurrencyStamp = Guid.NewGuid().ToString();

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TripExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpPost("{id}/join")]
        public async Task<IActionResult> JoinTrip(int id)
        {
            var trip = await _context.Trips
                .Include(t => t.Participants)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trip == null)
                return NotFound();

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            if (!trip.HasAvailableSpots)
                return BadRequest(new { message = "Trip is full" });

            if (trip.IsUserParticipant(user.Id))
                return BadRequest(new { message = "Already participating in this trip" });

            trip.Participants.Add(user);
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpPost("{id}/leave")]
        public async Task<IActionResult> LeaveTrip(int id)
        {
            var trip = await _context.Trips
                .Include(t => t.Participants)
                .Include(t => t.CoOwners)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trip == null)
                return NotFound();

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            if (!trip.IsUserParticipant(user.Id))
                return BadRequest(new { message = "Not participating in this trip" });

            // Remove from participants
            trip.Participants.Remove(user);

            // If user is a co-owner, remove from co-owners as well
            if (trip.CoOwners.Contains(user))
            {
                trip.CoOwners.Remove(user);
            }

            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpPost("{id}/co-owner/{userId}")]
        public async Task<IActionResult> AddCoOwner(int id, string userId)
        {
            var trip = await _context.Trips
                .Include(t => t.CoOwners)
                .Include(t => t.Participants)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trip == null)
                return NotFound();

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            if (!trip.IsUserOwner(user.Id))
                return Forbid();

            var coOwner = await _userManager.FindByIdAsync(userId);
            if (coOwner == null)
                return NotFound(new { message = "User not found" });

            if (trip.CoOwners.Contains(coOwner))
                return BadRequest(new { message = "User is already a co-owner" });

            if (!trip.Participants.Contains(coOwner))
                return BadRequest(new { message = "User must be a participant before becoming a co-owner" });

            trip.CoOwners.Add(coOwner);
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpDelete("{id}/co-owner/{userId}")]
        public async Task<IActionResult> RemoveCoOwner(int id, string userId)
        {
            var trip = await _context.Trips
                .Include(t => t.CoOwners)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trip == null)
                return NotFound();

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            if (!trip.IsUserOwner(user.Id))
                return Forbid();

            var coOwner = await _userManager.FindByIdAsync(userId);
            if (coOwner == null)
                return NotFound(new { message = "User not found" });

            if (!trip.CoOwners.Contains(coOwner))
                return BadRequest(new { message = "User is not a co-owner" });

            trip.CoOwners.Remove(coOwner);
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTrip(int id)
        {
            var trip = await _context.Trips
                .Include(t => t.Participants)
                .Include(t => t.CoOwners)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trip == null)
                return NotFound();

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            if (!trip.IsUserOwner(user.Id))
                return Forbid();

            // Remove all participants and co-owners
            trip.Participants.Clear();
            trip.CoOwners.Clear();

            _context.Trips.Remove(trip);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/transfer-ownership/{newOwnerId}")]
        public async Task<IActionResult> TransferOwnership(int id, string newOwnerId)
        {
            var trip = await _context.Trips
                .Include(t => t.Participants)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trip == null)
                return NotFound();

            var currentUser = await _userManager.GetUserAsync(User);
            if (currentUser == null)
                return Unauthorized();

            // Check if current user is the owner
            if (trip.OwnerId != currentUser.Id)
                return Forbid();

            // Prevent transferring ownership to yourself
            if (currentUser.Id == newOwnerId)
                return BadRequest(new { message = "Cannot transfer ownership to yourself" });

            var newOwner = await _userManager.FindByIdAsync(newOwnerId);
            if (newOwner == null)
                return NotFound(new { message = "New owner not found" });

            // Check if new owner is a participant
            if (!trip.Participants.Any(p => p.Id == newOwnerId))
                return BadRequest(new { message = "New owner must be a participant of the trip" });

            // Transfer ownership
            trip.OwnerId = newOwnerId;
            trip.ConcurrencyStamp = Guid.NewGuid().ToString();

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Ownership transferred successfully" });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TripExists(id))
                    return NotFound();
                throw;
            }
        }

        private bool TripExists(int id)
        {
            return _context.Trips.Any(e => e.Id == id);
        }
    }

    public class CreateTripModel
    {
        public string Name { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Price { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Capacity { get; set; }
    }

    public class UpdateTripModel
    {
        public string Name { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Price { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Capacity { get; set; }
    }
}