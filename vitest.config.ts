import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
      'src/__tests__/**/*.{test,spec}.{ts,tsx}',
      'src/components/**/__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['node_modules', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Focus coverage on critical files that are tested
      include: [
        'src/lib/utils.ts',
        'src/lib/animations.ts',
        'src/lib/a11y.ts',
        'src/lib/api/**/*.ts',
        'src/hooks/use-workflow.ts',
        'src/hooks/use-notifications.ts',
        'src/hooks/use-tenders.ts',
        'src/stores/**/*.ts',
        'src/components/premium/cards/**/*.{ts,tsx}',
        'src/components/ui/**/*.{ts,tsx}',
        'src/components/layout/**/*.{ts,tsx}',
        'src/app/(dashboard)/tenders/**/*.{ts,tsx}',
        'src/app/(dashboard)/layout.tsx',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.{ts,tsx}',
        'src/**/index.ts',
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}',
      ],
      thresholds: {
        // Thresholds for the critical files we're testing
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.test.json',
    },
    // Test isolation - clean mocks between tests
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    // Performance
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    // Reporter
    reporter: process.env.CI ? ['junit', 'json', 'verbose'] : ['verbose'],
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
