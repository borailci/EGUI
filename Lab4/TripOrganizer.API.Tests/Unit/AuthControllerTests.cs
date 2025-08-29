using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Threading.Tasks;
using TripOrganizer.API.Controllers;
using TripOrganizer.API.Data;
using TripOrganizer.API.Models;
using Xunit;

namespace TripOrganizer.API.Tests.Unit
{
    public class AuthControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly AuthController _controller;
        private readonly Mock<ILogger<AuthController>> _mockLogger;
        private readonly Mock<IConfiguration> _mockConfiguration;

        public AuthControllerTests()
        {
            // Setup InMemory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _mockLogger = new Mock<ILogger<AuthController>>();
            _mockConfiguration = new Mock<IConfiguration>();

            // Setup JWT configuration mock
            _mockConfiguration.Setup(x => x["Jwt:Key"])
                .Returns("test-secret-key-that-is-long-enough-for-hs256-algorithm-testing");
            _mockConfiguration.Setup(x => x["Jwt:Issuer"])
                .Returns("test-issuer");
            _mockConfiguration.Setup(x => x["Jwt:Audience"])
                .Returns("test-audience");
            _mockConfiguration.Setup(x => x["Jwt:ExpiryInMinutes"])
                .Returns("60");

            _controller = new AuthController(_context, _mockConfiguration.Object, _mockLogger.Object);
        }

        [Fact]
        public async Task Register_ReturnsConflict_WhenUserAlreadyExists()
        {
            // Arrange
            var existingUser = new User
            {
                Id = 1,
                Email = "test@example.com",
                Username = "testuser",
                PasswordHash = "hashedpassword"
            };

            _context.Users.Add(existingUser);
            await _context.SaveChangesAsync();

            var registerRequest = new
            {
                Email = "test@example.com",
                Username = "newuser",
                Password = "Password123!"
            };

            // Act
            var result = await _controller.Register(registerRequest);

            // Assert
            Assert.IsType<ConflictObjectResult>(result);
        }

        [Fact]
        public async Task Register_ReturnsBadRequest_WhenEmailIsInvalid()
        {
            // Arrange
            var registerRequest = new
            {
                Email = "invalid-email",
                Username = "testuser",
                Password = "Password123!"
            };

            // Act
            var result = await _controller.Register(registerRequest);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task Login_ReturnsUnauthorized_WhenUserDoesNotExist()
        {
            // Arrange
            var loginRequest = new
            {
                Email = "nonexistent@example.com",
                Password = "Password123!"
            };

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task Login_ReturnsUnauthorized_WhenPasswordIsIncorrect()
        {
            // Arrange
            var user = new User
            {
                Id = 1,
                Email = "test@example.com",
                Username = "testuser",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!")
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var loginRequest = new
            {
                Email = "test@example.com",
                Password = "WrongPassword123!"
            };

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
