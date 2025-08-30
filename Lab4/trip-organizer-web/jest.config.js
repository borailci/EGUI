/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // The test environment that will be used for testing, 'jsdom' simulates a browser
  testEnvironment: 'jest-environment-jsdom',

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  // We are using it to import jest-dom extensions like .toBeInTheDocument()
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],

  // A map from regular expressions to paths to transformers.
  // This tells Jest to use 'ts-jest' to process any .ts or .tsx files.
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  // An array of file extensions your modules use.
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module.
  // This is useful for mocking CSS files, images, or other non-JavaScript assets.
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // The root directory that Jest should scan for tests and modules within.
  // We're pointing it to the 'src' directory.
  roots: ['<rootDir>/src'],

  // The glob patterns Jest uses to detect test files.
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
};
