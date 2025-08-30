using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using TripOrganizer.API.Controllers;
using TripOrganizer.API.Models;
using Xunit;
using FluentAssertions;
using System.Security.Claims;

namespace TripOrganizer.API.Tests.Unit
{
    public class AuthControllerTests
    {
        private readonly Mock<UserManager<User>> _userManagerMock;
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            // Mock UserManager
            var userStore = new Mock<IUserStore<User>>();
            _userManagerMock = new Mock<UserManager<User>>(
                userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            // Mock Configuration
            _configurationMock = new Mock<IConfiguration>();
            _configurationMock.Setup(x => x["Jwt:Key"]).Returns("ThisIsASecretKeyThatIsAtLeast32CharactersLong");
            _configurationMock.Setup(x => x["Jwt:Issuer"]).Returns("TripOrganizer");
            _configurationMock.Setup(x => x["Jwt:Audience"]).Returns("TripOrganizer");

            _controller = new AuthController(_userManagerMock.Object, _configurationMock.Object);
        }

        [Fact]
        public async Task Register_WithValidData_ReturnsOk()
        {
            // Arrange
            var registerModel = new RegisterModel
            {
                Email = "test@example.com",
                Password = "TestPassword123!",
                FullName = "Test User"
            };

            _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<User>(), registerModel.Password))
                .ReturnsAsync(IdentityResult.Success);

            var createdUser = new User
            {
                Id = "test-id",
                Email = registerModel.Email,
                UserName = registerModel.Email,
                FullName = registerModel.FullName
            };

            _userManagerMock.Setup(x => x.FindByEmailAsync(registerModel.Email))
                .ReturnsAsync(createdUser);

            _userManagerMock.Setup(x => x.GetClaimsAsync(createdUser))
                .ReturnsAsync(new List<Claim>());

            // Act
            var result = await _controller.Register(registerModel);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult!.Value.Should().NotBeNull();
        }

        [Fact]
        public async Task Register_WithExistingEmail_ReturnsBadRequest()
        {
            // Arrange
            var registerModel = new RegisterModel
            {
                Email = "existing@example.com",
                Password = "TestPassword123!",
                FullName = "Test User"
            };

            var errors = new IdentityError[]
            {
                new IdentityError { Code = "DuplicateUserName", Description = "Username already exists" }
            };

            _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<User>(), registerModel.Password))
                .ReturnsAsync(IdentityResult.Failed(errors));

            // Act
            var result = await _controller.Register(registerModel);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task Login_WithValidCredentials_ReturnsOkWithToken()
        {
            // Arrange
            var loginModel = new LoginModel
            {
                Email = "test@example.com",
                Password = "TestPassword123!"
            };

            var user = new User
            {
                Id = "test-id",
                Email = loginModel.Email,
                UserName = loginModel.Email,
                FullName = "Test User"
            };

            _userManagerMock.Setup(x => x.FindByEmailAsync(loginModel.Email))
                .ReturnsAsync(user);

            _userManagerMock.Setup(x => x.CheckPasswordAsync(user, loginModel.Password))
                .ReturnsAsync(true);

            _userManagerMock.Setup(x => x.GetClaimsAsync(user))
                .ReturnsAsync(new List<Claim>());

            // Act
            var result = await _controller.Login(loginModel);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult!.Value.Should().NotBeNull();
        }

        [Fact]
        public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            var loginModel = new LoginModel
            {
                Email = "test@example.com",
                Password = "WrongPassword"
            };

            var user = new User
            {
                Id = "test-id",
                Email = loginModel.Email,
                UserName = loginModel.Email,
                FullName = "Test User"
            };

            _userManagerMock.Setup(x => x.FindByEmailAsync(loginModel.Email))
                .ReturnsAsync(user);

            _userManagerMock.Setup(x => x.CheckPasswordAsync(user, loginModel.Password))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.Login(loginModel);

            // Assert
            result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        [Fact]
        public async Task Login_WithNonExistentUser_ReturnsUnauthorized()
        {
            // Arrange
            var loginModel = new LoginModel
            {
                Email = "nonexistent@example.com",
                Password = "TestPassword123!"
            };

            _userManagerMock.Setup(x => x.FindByEmailAsync(loginModel.Email))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _controller.Login(loginModel);

            // Assert
            result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        [Fact]
        public void HealthCheck_ReturnsOk()
        {
            // Act
            var result = _controller.HealthCheck();

            // Assert
            result.Should().BeOfType<OkObjectResult>();
        }
    }
}