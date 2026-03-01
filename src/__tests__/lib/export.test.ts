/**
 * Tests unitaires pour src/lib/export.ts
 * Tests des fonctions d'export (CSV, JSON) et formatters
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatters } from '@/lib/export';

// Note: exportToCSV, exportToExcel, exportToPDF, exportToJSON ne sont pas testés
// car ils dépendent du DOM (window.open, document.createElement, Blob, URL.createObjectURL)
// Ces fonctions nécessitent des tests E2E ou des tests avec jsdom mockés

describe('formatters.currency', () => {
  it('should format number as EUR currency', () => {
    expect(formatters.currency(1000)).toBe('1\u202f000,00\u00a0€');
  });

  it('should format with decimals', () => {
    expect(formatters.currency(1234.56)).toBe('1\u202f234,56\u00a0€');
  });

  it('should handle zero', () => {
    expect(formatters.currency(0)).toBe('0,00\u00a0€');
  });

  it('should handle negative numbers', () => {
    expect(formatters.currency(-500)).toBe('-500,00\u00a0€');
  });

  it('should handle string numbers', () => {
    expect(formatters.currency('1000')).toBe('1\u202f000,00\u00a0€');
  });

  it('should return empty string for NaN', () => {
    expect(formatters.currency('invalid')).toBe('');
  });

  it('should handle null as zero', () => {
    // Number(null) = 0
    expect(formatters.currency(null)).toBe('0,00\u00a0€');
  });

  it('should handle undefined as NaN (empty string)', () => {
    // Number(undefined) = NaN
    expect(formatters.currency(undefined)).toBe('');
  });

  it('should handle large numbers', () => {
    expect(formatters.currency(1000000)).toBe('1\u202f000\u202f000,00\u00a0€');
  });

  it('should handle very small numbers', () => {
    expect(formatters.currency(0.01)).toBe('0,01\u00a0€');
  });
});

describe('formatters.percentage', () => {
  it('should format number as percentage with 1 decimal', () => {
    expect(formatters.percentage(42.5)).toBe('42.5%');
  });

  it('should round to 1 decimal', () => {
    expect(formatters.percentage(42.567)).toBe('42.6%');
  });

  it('should handle zero', () => {
    expect(formatters.percentage(0)).toBe('0.0%');
  });

  it('should handle negative numbers', () => {
    expect(formatters.percentage(-15.3)).toBe('-15.3%');
  });

  it('should handle string numbers', () => {
    expect(formatters.percentage('50.5')).toBe('50.5%');
  });

  it('should return empty string for NaN', () => {
    expect(formatters.percentage('invalid')).toBe('');
  });

  it('should handle null as zero', () => {
    // Number(null) = 0
    expect(formatters.percentage(null)).toBe('0.0%');
  });

  it('should handle undefined as NaN (empty string)', () => {
    // Number(undefined) = NaN
    expect(formatters.percentage(undefined)).toBe('');
  });

  it('should handle 100%', () => {
    expect(formatters.percentage(100)).toBe('100.0%');
  });

  it('should handle very small percentages', () => {
    expect(formatters.percentage(0.123)).toBe('0.1%');
  });
});

describe('formatters.number', () => {
  it('should format number with French locale', () => {
    expect(formatters.number(1234.56)).toBe('1\u202f234,56');
  });

  it('should handle integers', () => {
    expect(formatters.number(1000)).toBe('1\u202f000');
  });

  it('should handle zero', () => {
    expect(formatters.number(0)).toBe('0');
  });

  it('should handle negative numbers', () => {
    expect(formatters.number(-1234.56)).toBe('-1\u202f234,56');
  });

  it('should handle string numbers', () => {
    expect(formatters.number('1234.56')).toBe('1\u202f234,56');
  });

  it('should return empty string for NaN', () => {
    expect(formatters.number('invalid')).toBe('');
  });

  it('should handle null as zero', () => {
    // Number(null) = 0
    expect(formatters.number(null)).toBe('0');
  });

  it('should handle undefined as NaN (empty string)', () => {
    // Number(undefined) = NaN
    expect(formatters.number(undefined)).toBe('');
  });

  it('should handle large numbers', () => {
    expect(formatters.number(1000000)).toBe('1\u202f000\u202f000');
  });

  it('should handle decimals', () => {
    expect(formatters.number(0.123456)).toBe('0,123');
  });
});

describe('formatters.date', () => {
  it('should format Date object', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const result = formatters.date(date);
    expect(result).toBe('15/01/2024');
  });

  it('should format ISO string', () => {
    const result = formatters.date('2024-01-15T12:00:00Z');
    expect(result).toBe('15/01/2024');
  });

  it('should format timestamp', () => {
    const timestamp = new Date('2024-01-15T12:00:00Z').getTime();
    const result = formatters.date(timestamp);
    expect(result).toBe('15/01/2024');
  });

  it('should return empty string for null', () => {
    expect(formatters.date(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatters.date(undefined)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(formatters.date('')).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(formatters.date('invalid')).toBe('');
  });

  it('should handle different years', () => {
    const date = new Date('2025-12-31T12:00:00Z');
    const result = formatters.date(date);
    expect(result).toMatch(/\d{2}\/\d{2}\/2025/);
  });

  it('should handle leap year', () => {
    const date = new Date('2024-02-29T12:00:00Z');
    const result = formatters.date(date);
    expect(result).toBe('29/02/2024');
  });
});

describe('formatters.datetime', () => {
  it('should format Date object with time', () => {
    const date = new Date('2024-01-15T14:30:00Z');
    const result = formatters.datetime(date);
    // Result depends on timezone, so we just check it contains both date and time components
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('should format ISO string with time', () => {
    const result = formatters.datetime('2024-01-15T14:30:00Z');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('should format timestamp with time', () => {
    const timestamp = new Date('2024-01-15T14:30:00Z').getTime();
    const result = formatters.datetime(timestamp);
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('should return empty string for null', () => {
    expect(formatters.datetime(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatters.datetime(undefined)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(formatters.datetime('')).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(formatters.datetime('invalid')).toBe('');
  });

  it('should handle midnight', () => {
    const date = new Date('2024-01-15T00:00:00Z');
    const result = formatters.datetime(date);
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('should handle end of day', () => {
    const date = new Date('2024-01-15T23:59:59Z');
    const result = formatters.datetime(date);
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});

describe('formatters.boolean', () => {
  it('should return "Oui" for true', () => {
    expect(formatters.boolean(true)).toBe('Oui');
  });

  it('should return "Non" for false', () => {
    expect(formatters.boolean(false)).toBe('Non');
  });

  it('should return "Non" for null', () => {
    expect(formatters.boolean(null)).toBe('Non');
  });

  it('should return "Non" for undefined', () => {
    expect(formatters.boolean(undefined)).toBe('Non');
  });

  it('should return "Non" for 0', () => {
    expect(formatters.boolean(0)).toBe('Non');
  });

  it('should return "Oui" for 1', () => {
    expect(formatters.boolean(1)).toBe('Oui');
  });

  it('should return "Non" for empty string', () => {
    expect(formatters.boolean('')).toBe('Non');
  });

  it('should return "Oui" for non-empty string', () => {
    expect(formatters.boolean('hello')).toBe('Oui');
  });

  it('should return "Oui" for arrays', () => {
    expect(formatters.boolean([])).toBe('Oui');
  });

  it('should return "Oui" for objects', () => {
    expect(formatters.boolean({})).toBe('Oui');
  });
});

describe('formatters - edge cases', () => {
  it('should handle Infinity', () => {
    expect(formatters.number(Infinity)).toBe('∞');
  });

  it('should handle -Infinity', () => {
    expect(formatters.number(-Infinity)).toBe('-∞');
  });

  it('should handle very large numbers in currency', () => {
    const result = formatters.currency(999999999999);
    expect(result).toContain('€');
  });

  it('should handle very small decimals in percentage', () => {
    expect(formatters.percentage(0.0001)).toBe('0.0%');
  });

  it('should handle dates far in the past', () => {
    const date = new Date('1900-01-01T00:00:00Z');
    const result = formatters.date(date);
    expect(result).toBe('01/01/1900');
  });

  it('should handle dates far in the future', () => {
    const date = new Date('2100-12-31T12:00:00Z');
    const result = formatters.date(date);
    // Result may vary based on timezone
    expect(result).toMatch(/\d{2}\/\d{2}\/21\d{2}/);
    expect(result).toContain('2100');
  });
});
