import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  clearMocks: true,
  // Runs before any test module imports src/config — isolates HOME per worker.
  setupFiles: ['<rootDir>/tests/setup.ts'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  // commander ships as ESM-only; transpile it (and our TS) through ts-jest
  // instead of leaving it in the default node_modules ignore list.
  transformIgnorePatterns: ['/node_modules/(?!(commander)/)'],
};

export default config;
