/**
 * Setup global pour les tests WebSocket/Realtime
 *
 * Configure l'environnement de test avec les mocks et polyfills nécessaires
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Étendre les matchers Jest DOM
expect.extend(matchers);

// Cleanup après chaque test
afterEach(() => {
  cleanup();
});

// ============================================
// Global Mocks
// ============================================

// Mock Audio API
global.Audio = class MockAudio {
  volume = 1;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  load = vi.fn();
  src = '';
} as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = '';
  thresholds = [];
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
} as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  return setTimeout(() => callback(Date.now()), 0) as unknown as number;
});

global.cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id);
});

// Mock performance si nécessaire
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
  } as any;
}

// ============================================
// Environment Variables
// ============================================

process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost/ws';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';

// ============================================
// WebSocket Mock Reset
// ============================================

// S'assurer que WebSocket est reset entre les tests
afterEach(() => {
  // Reset WebSocket mock si elle existe
  if (global.WebSocket) {
    (global.WebSocket as any).mockClear?.();
  }
});

// ============================================
// Console Spy Setup
// ============================================

// Par défaut, ne pas afficher les logs pendant les tests
// Les tests individuels peuvent override cela si nécessaire
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

// Fonction pour restaurer la console (utile pour debugging)
export function restoreConsole() {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
}

// ============================================
// Test Utilities
// ============================================

/**
 * Attendre que toutes les promesses soient résolues
 */
export async function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Créer un delay pour tests async
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper pour attendre une condition
 */
export async function waitUntil(
  condition: () => boolean,
  timeout = 1000,
  interval = 10
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await delay(interval);
  }
}

// ============================================
// Type Augmentation
// ============================================

declare global {
  interface Window {
    matchMedia: (query: string) => MediaQueryList;
  }
}

export {};
