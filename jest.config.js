/**
 * Jest Configuration for Database Tests
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/database'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'database/**/*.ts',
    '!database/**/*.test.ts',
    '!database/__tests__/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/database/__tests__/setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
}
