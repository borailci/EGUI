using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TripOrganizer.API.Controllers;
using TripOrganizer.API.Data;
using TripOrganizer.API.Models;
using Xunit;

namespace TripOrganizer.API.Tests.Unit
{
    public class TripsControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly TripsController _controller;
        private readonly Mock<ILogger<TripsController>> _mockLogger;
        private readonly Mock<IConfiguration> _mockConfiguration;

        public TripsControllerTests()
        {
            // Setup InMemory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _mockLogger = new Mock<ILogger<TripsController>>();
            _mockConfiguration = new Mock<IConfiguration>();

            _controller = new TripsController(_context, _mockLogger.Object, _mockConfiguration.Object);
        }

        [Fact]
        public async Task GetTrips_ReturnsEmptyList_WhenNoTripsExist()
        {
            // Act
            var result = await _controller.GetTrips();

            // Assert
            var actionResult = Assert.IsType<ActionResult<IEnumerable<Trip>>>(result);
            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            var trips = Assert.IsAssignableFrom<IEnumerable<Trip>>(okResult.Value);

            trips.Should().BeEmpty();
        }

        [Fact]
        public async Task GetTrips_ReturnsTrips_WhenTripsExist()
        {
            // Arrange
            var testTrips = new List<Trip>
            {
                new Trip
                {
                    Id = 1,
                    Name = "Test Trip 1",
                    Description = "Test Description 1",
                    StartDate = DateTime.Now.AddDays(1),
                    EndDate = DateTime.Now.AddDays(5),
                    MaxParticipants = 10,
                    UserId = 1
                },
                new Trip
                {
                    Id = 2,
                    Name = "Test Trip 2",
                    Description = "Test Description 2",
                    StartDate = DateTime.Now.AddDays(10),
                    EndDate = DateTime.Now.AddDays(15),
                    MaxParticipants = 5,
                    UserId = 1
                }
            };

            _context.Trips.AddRange(testTrips);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetTrips();

            // Assert
            var actionResult = Assert.IsType<ActionResult<IEnumerable<Trip>>>(result);
            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            var trips = Assert.IsAssignableFrom<IEnumerable<Trip>>(okResult.Value);

            trips.Should().HaveCount(2);
            trips.Should().Contain(t => t.Name == "Test Trip 1");
            trips.Should().Contain(t => t.Name == "Test Trip 2");
        }

        [Fact]
        public async Task GetTrip_ReturnsNotFound_WhenTripDoesNotExist()
        {
            // Act
            var result = await _controller.GetTrip(999);

            // Assert
            var actionResult = Assert.IsType<ActionResult<Trip>>(result);
            Assert.IsType<NotFoundResult>(actionResult.Result);
        }

        [Fact]
        public async Task GetTrip_ReturnsTrip_WhenTripExists()
        {
            // Arrange
            var testTrip = new Trip
            {
                Id = 1,
                Name = "Test Trip",
                Description = "Test Description",
                StartDate = DateTime.Now.AddDays(1),
                EndDate = DateTime.Now.AddDays(5),
                MaxParticipants = 10,
                UserId = 1
            };

            _context.Trips.Add(testTrip);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetTrip(1);

            // Assert
            var actionResult = Assert.IsType<ActionResult<Trip>>(result);
            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            var trip = Assert.IsType<Trip>(okResult.Value);

            trip.Name.Should().Be("Test Trip");
            trip.Description.Should().Be("Test Description");
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
