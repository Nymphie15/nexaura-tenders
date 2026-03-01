/**
 * Configuration Vitest pour les tests WebSocket/Realtime
 *
 * Configuration spécifique avec timeouts adaptés pour les tests async WebSocket
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'realtime-websocket',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setup.ts'],

    // Timeouts adaptés pour tests WebSocket
    testTimeout: 10000, // 10s pour chaque test
    hookTimeout: 5000,  // 5s pour les hooks

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/hooks/use-realtime-notifications.ts',
        'src/hooks/use-assistant-websocket.ts'
      ],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.test.ts',
        '**/*.test.tsx'
      ],
      all: true,
      lines: 95,
      functions: 95,
      branches: 90,
      statements: 95
    },

    // Reporters
    reporters: ['verbose'],

    // Isolation
    isolate: true,
    threads: true,

    // Mock reset
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // Retry flaky tests
    retry: 1,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../'),
    },
  },
});
