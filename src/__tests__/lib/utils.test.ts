/**
 * Tests unitaires pour src/lib/utils.ts
 * Tests des fonctions utilitaires pures (formatting, string manipulation, etc.)
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

describe('cn - classNames utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active', false && 'disabled')).toBe('base active');
  });

  it('should merge Tailwind conflicting classes (via twMerge)', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle arrays', () => {
    expect(cn(['base', 'active'])).toBe('base active');
  });

  it('should handle objects', () => {
    expect(cn({ base: true, active: true, disabled: false })).toBe('base active');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
  });
});

describe('formatCurrency', () => {
  it('should format EUR currency with default locale (fr-FR)', () => {
    expect(formatCurrency(1000)).toBe('1\u202f000\u00a0€');
  });

  it('should format with no decimal places', () => {
    expect(formatCurrency(1234.56)).toBe('1\u202f235\u00a0€');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('0\u00a0€');
  });

  it('should handle negative numbers', () => {
    expect(formatCurrency(-500)).toBe('-500\u00a0€');
  });

  it('should support custom locale', () => {
    const result = formatCurrency(1000, 'en-US', 'USD');
    expect(result).toContain('1,000');
  });

  it('should support custom currency', () => {
    const result = formatCurrency(1000, 'fr-FR', 'GBP');
    expect(result).toContain('£');
  });

  it('should handle large numbers', () => {
    expect(formatCurrency(1000000)).toBe('1\u202f000\u202f000\u00a0€');
  });
});

describe('formatNumber', () => {
  it('should format number with default locale (fr-FR)', () => {
    expect(formatNumber(1234.56)).toBe('1\u202f234,56');
  });

  it('should handle integers', () => {
    expect(formatNumber(1000)).toBe('1\u202f000');
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('should support custom options', () => {
    const result = formatNumber(0.1234, 'fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
    });
    expect(result).toContain('12');
  });

  it('should handle negative numbers', () => {
    expect(formatNumber(-1234.56)).toBe('-1\u202f234,56');
  });

  it('should support custom locale', () => {
    expect(formatNumber(1234.56, 'en-US')).toBe('1,234.56');
  });
});

describe('formatDate', () => {
  it('should format Date object with default options', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const result = formatDate(date);
    expect(result).toContain('15');
    expect(result).toContain('janv.');
    expect(result).toContain('2024');
  });

  it('should format ISO string', () => {
    const result = formatDate('2024-01-15T12:00:00Z');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('should support custom options', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const result = formatDate(date, { month: 'long', day: '2-digit' });
    expect(result).toContain('15');
    expect(result).toContain('janvier');
  });

  it('should handle different years', () => {
    const date = new Date('2025-12-31T23:59:59Z');
    const result = formatDate(date);
    // Result may vary based on timezone, just check format is valid
    expect(result).toMatch(/\d{1,2}\s\w+\.?\s\d{4}/);
  });
});

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Aujourd\'hui" for today', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const today = new Date('2024-01-15T08:00:00Z');
    expect(formatRelativeDate(today)).toBe("Aujourd'hui");
  });

  it('should return "Hier" for yesterday', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const yesterday = new Date('2024-01-14T08:00:00Z');
    expect(formatRelativeDate(yesterday)).toBe('Hier');
  });

  it('should return "Il y a X jours" for less than a week', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const threeDaysAgo = new Date('2024-01-12T08:00:00Z');
    expect(formatRelativeDate(threeDaysAgo)).toBe('Il y a 3 jours');
  });

  it('should return "Il y a X semaines" for less than a month', () => {
    const now = new Date('2024-01-29T12:00:00Z');
    vi.setSystemTime(now);

    const twoWeeksAgo = new Date('2024-01-15T08:00:00Z');
    expect(formatRelativeDate(twoWeeksAgo)).toBe('Il y a 2 semaines');
  });

  it('should return formatted date for more than a month', () => {
    const now = new Date('2024-03-15T12:00:00Z');
    vi.setSystemTime(now);

    const twoMonthsAgo = new Date('2024-01-15T08:00:00Z');
    const result = formatRelativeDate(twoMonthsAgo);
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('should handle ISO string input', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);

    expect(formatRelativeDate('2024-01-15T08:00:00Z')).toBe("Aujourd'hui");
  });
});

describe('formatPercent', () => {
  it('should format percentage with default 0 decimals', () => {
    expect(formatPercent(42)).toBe('42%');
  });

  it('should handle decimals parameter', () => {
    expect(formatPercent(42.567, 2)).toBe('42.57%');
  });

  it('should round correctly', () => {
    expect(formatPercent(42.567, 1)).toBe('42.6%');
  });

  it('should handle zero', () => {
    expect(formatPercent(0)).toBe('0%');
  });

  it('should handle negative numbers', () => {
    expect(formatPercent(-15.5, 1)).toBe('-15.5%');
  });

  it('should handle 100%', () => {
    expect(formatPercent(100)).toBe('100%');
  });

  it('should handle very small numbers', () => {
    expect(formatPercent(0.123, 3)).toBe('0.123%');
  });
});

describe('truncate', () => {
  it('should truncate string longer than length', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  it('should not truncate string shorter than length', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('should not truncate string equal to length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  it('should handle empty string', () => {
    expect(truncate('', 5)).toBe('');
  });

  it('should handle length 0', () => {
    expect(truncate('Hello', 0)).toBe('...');
  });

  it('should preserve unicode characters', () => {
    expect(truncate('Héllo Wörld', 5)).toBe('Héllo...');
  });
});

describe('capitalize', () => {
  it('should capitalize first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('should lowercase the rest', () => {
    expect(capitalize('hELLO')).toBe('Hello');
  });

  it('should handle single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('should handle empty string', () => {
    expect(capitalize('')).toBe('');
  });

  it('should handle already capitalized', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('should handle all caps', () => {
    expect(capitalize('HELLO WORLD')).toBe('Hello world');
  });

  it('should handle unicode', () => {
    expect(capitalize('école')).toBe('École');
  });
});

describe('slugify', () => {
  it('should convert to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should replace spaces with hyphens', () => {
    expect(slugify('Hello World Test')).toBe('hello-world-test');
  });

  it('should remove accents', () => {
    expect(slugify('Café Crème')).toBe('cafe-creme');
  });

  it('should remove special characters', () => {
    expect(slugify('Hello@World!')).toBe('hello-world');
  });

  it('should remove leading/trailing hyphens', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world');
  });

  it('should collapse multiple hyphens', () => {
    expect(slugify('Hello   World')).toBe('hello-world');
  });

  it('should handle all special characters', () => {
    expect(slugify('Hello@#$%World')).toBe('hello-world');
  });

  it('should handle empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('should handle numbers', () => {
    expect(slugify('Hello 123 World')).toBe('hello-123-world');
  });

  it('should handle complex unicode', () => {
    expect(slugify('Ça été élégant')).toBe('ca-ete-elegant');
  });
});

describe('getInitials', () => {
  it('should get initials from two words', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('should get initials from one word', () => {
    // getInitials takes first letter of each word, limited to 2 chars
    // For single word, it takes first char only
    expect(getInitials('John')).toBe('J');
  });

  it('should get initials from three words (max 2)', () => {
    expect(getInitials('John William Doe')).toBe('JW');
  });

  it('should handle lowercase', () => {
    expect(getInitials('john doe')).toBe('JD');
  });

  it('should handle mixed case', () => {
    expect(getInitials('jOhN dOe')).toBe('JD');
  });

  it('should handle single character name', () => {
    expect(getInitials('J D')).toBe('JD');
  });

  it('should handle name with extra spaces', () => {
    expect(getInitials('John  Doe')).toBe('JD');
  });

  it('should handle empty string', () => {
    expect(getInitials('')).toBe('');
  });

  it('should handle unicode characters', () => {
    expect(getInitials('Émile Zola')).toBe('ÉZ');
  });
});

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve after specified milliseconds', async () => {
    const promise = sleep(1000);

    vi.advanceTimersByTime(999);
    expect(promise).toBeInstanceOf(Promise);

    vi.advanceTimersByTime(1);
    await expect(promise).resolves.toBeUndefined();
  });

  it('should handle zero delay', async () => {
    const promise = sleep(0);
    vi.advanceTimersByTime(0);
    await expect(promise).resolves.toBeUndefined();
  });

  it('should handle multiple concurrent sleeps', async () => {
    const sleep1 = sleep(100);
    const sleep2 = sleep(200);

    vi.advanceTimersByTime(100);
    await expect(sleep1).resolves.toBeUndefined();

    vi.advanceTimersByTime(100);
    await expect(sleep2).resolves.toBeUndefined();
  });
});
