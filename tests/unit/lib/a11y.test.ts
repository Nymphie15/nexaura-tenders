/**
 * Accessibility Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  announceToScreenReader,
  prefersReducedMotion,
} from '@/lib/accessibility';

describe('Color Contrast Utilities', () => {
  describe('getContrastRatio', () => {
    it('returns 21 for black on white', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('returns 1 for same colors', () => {
      const ratio = getContrastRatio('#FF0000', '#FF0000');
      expect(ratio).toBe(1);
    });

    it('returns same ratio regardless of color order', () => {
      const ratio1 = getContrastRatio('#000000', '#FFFFFF');
      const ratio2 = getContrastRatio('#FFFFFF', '#000000');
      expect(ratio1).toBe(ratio2);
    });
  });

  describe('meetsWCAGAA', () => {
    it('black on white meets AA for normal text', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(meetsWCAGAA(ratio, false)).toBe(true);
    });

    it('low contrast fails AA', () => {
      const ratio = getContrastRatio('#777777', '#888888');
      expect(meetsWCAGAA(ratio, false)).toBe(false);
    });

    it('large text has lower contrast requirement', () => {
      // 3:1 is enough for large text AA
      const ratio = getContrastRatio('#767676', '#FFFFFF');
      expect(ratio).toBeGreaterThan(3);
      expect(meetsWCAGAA(ratio, true)).toBe(true);
    });
  });

  describe('meetsWCAGAAA', () => {
    it('black on white meets AAA for normal text', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(meetsWCAGAAA(ratio, false)).toBe(true);
    });
  });
});

describe('Reduced Motion', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  it('returns false by default', () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it('returns true when user prefers reduced motion', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    expect(prefersReducedMotion()).toBe(true);
  });
});

describe('Announce Function', () => {
  beforeEach(() => {
    // Clean up any existing announcer
    const existing = document.getElementById('accessibility-live-region');
    if (existing) {
      existing.remove();
    }
  });

  afterEach(() => {
    const announcer = document.getElementById('accessibility-live-region');
    if (announcer) {
      announcer.remove();
    }
  });

  it('creates announcer element on first call', () => {
    announceToScreenReader('Test message');

    const announcer = document.getElementById('accessibility-live-region');
    expect(announcer).toBeTruthy();
  });

  it('sets role=status attribute', () => {
    announceToScreenReader('Test message');

    const announcer = document.getElementById('accessibility-live-region');
    expect(announcer?.getAttribute('role')).toBe('status');
  });
});
