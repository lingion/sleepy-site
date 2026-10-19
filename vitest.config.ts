import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs', 'tests/**/*.test.ts'],
    passWithNoTests: true,
  },
});
