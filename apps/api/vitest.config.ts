import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'lcov'],
      include: ['src/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@nexus/shared': '../../packages/shared/src/index.ts',
    },
  },
});
