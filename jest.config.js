module.exports = {
  preset: 'jest-expo',
  // Agent worktrees under .claude/ hold other copies of the repo.
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
