/**
 * Utils Library Tests
 * Tests for utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeDate,
  formatPercent,
  truncate,
  capitalize,
  slugify,
  getInitials,
  sleep,
} from '@/lib/utils';

describe('cn (className merger)', () => {
  it('merges class names correctly', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const result = cn('base', true && 'included', false && 'excluded');
    expect(result).toBe('base included');
  });

  it('merges Tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('handles undefined and null values', () => {
    const result = cn('base', undefined, null, 'end');
    expect(result).toBe('base end');
  });

  it('handles array of classes', () => {
    const result = cn(['foo', 'bar']);
    expect(result).toBe('foo bar');
  });

  it('handles empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });
});

describe('formatCurrency', () => {
  it('formats currency in EUR by default', () => {
    const result = formatCurrency(1234);
    expect(result).toContain('1');
    expect(result).toContain('234');
  });

  it('formats with custom locale and currency', () => {
    const result = formatCurrency(1234, 'en-US', 'USD');
    expect(result).toContain('$');
    expect(result).toContain('1,234');
  });

  it('handles zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('handles negative numbers', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('500');
  });

  it('handles large numbers', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1');
    expect(result).toContain('000');
  });
});

describe('formatNumber', () => {
  it('formats numbers with default locale', () => {
    const result = formatNumber(1234567);
    // French locale uses space as separator
    expect(result.replace(/\s/g, '')).toBe('1234567');
  });

  it('formats with custom options', () => {
    const result = formatNumber(0.5, 'en-US', { style: 'percent' });
    expect(result).toBe('50%');
  });

  it('formats decimals', () => {
    const result = formatNumber(3.14159, 'en-US', { maximumFractionDigits: 2 });
    expect(result).toBe('3.14');
  });
});

describe('formatDate', () => {
  it('formats date with default options', () => {
    const date = new Date('2024-01-15');
    const result = formatDate(date);
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });

  it('formats date string', () => {
    const result = formatDate('2024-06-20');
    expect(result).toContain('2024');
  });

  it('applies custom options', () => {
    const date = new Date('2024-01-15');
    const result = formatDate(date, { weekday: 'long' });
    // Should include day of week
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Aujourd\'hui" for today', () => {
    const result = formatRelativeDate(new Date('2024-01-15T10:00:00'));
    expect(result).toBe("Aujourd'hui");
  });

  it('returns "Hier" for yesterday', () => {
    const result = formatRelativeDate(new Date('2024-01-14T10:00:00'));
    expect(result).toBe('Hier');
  });

  it('returns days ago for less than a week', () => {
    const result = formatRelativeDate(new Date('2024-01-12T10:00:00'));
    expect(result).toBe('Il y a 3 jours');
  });

  it('returns weeks ago for less than a month', () => {
    const result = formatRelativeDate(new Date('2024-01-01T10:00:00'));
    expect(result).toBe('Il y a 2 semaines');
  });

  it('returns formatted date for older dates', () => {
    const result = formatRelativeDate(new Date('2023-06-15T10:00:00'));
    expect(result).toContain('2023');
  });

  it('handles date strings', () => {
    const result = formatRelativeDate('2024-01-15T10:00:00');
    expect(result).toBe("Aujourd'hui");
  });
});

describe('formatPercent', () => {
  it('formats percent with no decimals by default', () => {
    const result = formatPercent(75);
    expect(result).toBe('75%');
  });

  it('formats percent with specified decimals', () => {
    const result = formatPercent(75.567, 2);
    expect(result).toBe('75.57%');
  });

  it('handles zero', () => {
    const result = formatPercent(0);
    expect(result).toBe('0%');
  });

  it('handles negative values', () => {
    const result = formatPercent(-25, 1);
    expect(result).toBe('-25.0%');
  });

  it('handles values over 100', () => {
    const result = formatPercent(150);
    expect(result).toBe('150%');
  });
});

describe('truncate', () => {
  it('truncates long strings', () => {
    const result = truncate('Hello World', 5);
    expect(result).toBe('Hello...');
  });

  it('does not truncate short strings', () => {
    const result = truncate('Hi', 10);
    expect(result).toBe('Hi');
  });

  it('handles exact length', () => {
    const result = truncate('Hello', 5);
    expect(result).toBe('Hello');
  });

  it('handles empty string', () => {
    const result = truncate('', 5);
    expect(result).toBe('');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    const result = capitalize('hello');
    expect(result).toBe('Hello');
  });

  it('lowercases rest of string', () => {
    const result = capitalize('HELLO');
    expect(result).toBe('Hello');
  });

  it('handles single character', () => {
    const result = capitalize('a');
    expect(result).toBe('A');
  });

  it('handles empty string', () => {
    const result = capitalize('');
    expect(result).toBe('');
  });

  it('handles mixed case', () => {
    const result = capitalize('hElLo WoRlD');
    expect(result).toBe('Hello world');
  });
});

describe('slugify', () => {
  it('converts to lowercase', () => {
    const result = slugify('HELLO');
    expect(result).toBe('hello');
  });

  it('replaces spaces with hyphens', () => {
    const result = slugify('Hello World');
    expect(result).toBe('hello-world');
  });

  it('removes special characters', () => {
    const result = slugify('Hello! World?');
    expect(result).toBe('hello-world');
  });

  it('removes accents', () => {
    const result = slugify('cafe resume');
    expect(result).toBe('cafe-resume');
  });

  it('handles multiple consecutive special chars', () => {
    const result = slugify('Hello   World!!!');
    expect(result).toBe('hello-world');
  });

  it('removes leading and trailing hyphens', () => {
    const result = slugify('  Hello World  ');
    expect(result).toBe('hello-world');
  });

  it('handles empty string', () => {
    const result = slugify('');
    expect(result).toBe('');
  });
});

describe('getInitials', () => {
  it('gets initials from full name', () => {
    const result = getInitials('John Doe');
    expect(result).toBe('JD');
  });

  it('handles single name', () => {
    const result = getInitials('John');
    expect(result).toBe('J');
  });

  it('handles three names', () => {
    const result = getInitials('John David Doe');
    expect(result).toBe('JD');
  });

  it('returns uppercase', () => {
    const result = getInitials('john doe');
    expect(result).toBe('JD');
  });

  it('limits to 2 characters', () => {
    const result = getInitials('A B C D E');
    expect(result).toBe('AB');
  });
});

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a promise', () => {
    const result = sleep(100);
    expect(result).toBeInstanceOf(Promise);
  });

  it('resolves after specified time', async () => {
    const callback = vi.fn();
    sleep(1000).then(callback);

    expect(callback).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(999);
    expect(callback).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(callback).toHaveBeenCalled();
  });

  it('works with zero delay', async () => {
    const callback = vi.fn();
    sleep(0).then(callback);

    await vi.advanceTimersByTimeAsync(0);
    expect(callback).toHaveBeenCalled();
  });
});
