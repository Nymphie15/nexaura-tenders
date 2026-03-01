/**
 * Analytics Hooks Tests
 * Verify that analytics hooks are properly exported and callable
 */

import { describe, it, expect } from 'vitest';

describe('Analytics hooks', () => {
  it('exports useUserKPIs as a function', async () => {
    const mod = await import('@/hooks/use-analytics');
    expect(mod.useUserKPIs).toBeDefined();
    expect(typeof mod.useUserKPIs).toBe('function');
  });

  it('exports useWinRate as a function', async () => {
    const mod = await import('@/hooks/use-analytics');
    expect(mod.useWinRate).toBeDefined();
    expect(typeof mod.useWinRate).toBe('function');
  });

  it('exports useActivityTimeline as a function', async () => {
    const mod = await import('@/hooks/use-analytics');
    expect(mod.useActivityTimeline).toBeDefined();
    expect(typeof mod.useActivityTimeline).toBe('function');
  });

  it('exports useRecommendations as a function', async () => {
    const mod = await import('@/hooks/use-analytics');
    expect(mod.useRecommendations).toBeDefined();
    expect(typeof mod.useRecommendations).toBe('function');
  });

  it('exports exactly 4 analytics hooks', async () => {
    const mod = await import('@/hooks/use-analytics');
    const exportedFunctions = Object.keys(mod).filter(
      (key) => typeof mod[key as keyof typeof mod] === 'function'
    );
    expect(exportedFunctions).toHaveLength(4);
    expect(exportedFunctions).toContain('useUserKPIs');
    expect(exportedFunctions).toContain('useWinRate');
    expect(exportedFunctions).toContain('useActivityTimeline');
    expect(exportedFunctions).toContain('useRecommendations');
  });
});
