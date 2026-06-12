import type { Config } from 'jest'
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  // Stale git worktrees under .claude/ were double-running every suite.
  testPathIgnorePatterns: ['/node_modules/', '/.claude/'],
}
export default config
