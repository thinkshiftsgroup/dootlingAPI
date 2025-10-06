/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^@models/(.*)$": "<rootDir>/src/models/$1",
    "^@middlewares/(.*)$": "<rootDir>/src/middlewares/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
  },
  testPathIgnorePatterns: ["/dist/"],
  coverageDirectory: "./coverage",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
    "!src/app.ts",
    "!src/config/*.ts",
  ],
};
