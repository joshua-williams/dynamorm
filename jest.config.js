/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [ "**/__tests__/**/*.(spec|test).ts" ],
  globalSetup: './__tests__/jestGlobalSetup.ts'
};
