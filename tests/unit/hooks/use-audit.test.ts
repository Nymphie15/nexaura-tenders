/**
 * Audit Hooks Tests
 * Verify that audit hooks are properly exported and callable
 */

import { describe, it, expect } from 'vitest';

describe('Audit hooks', () => {
  it('exports useAuditLogs as a function', async () => {
    const mod = await import('@/hooks/use-audit');
    expect(mod.useAuditLogs).toBeDefined();
    expect(typeof mod.useAuditLogs).toBe('function');
  });

  it('exports useAuditStats as a function', async () => {
    const mod = await import('@/hooks/use-audit');
    expect(mod.useAuditStats).toBeDefined();
    expect(typeof mod.useAuditStats).toBe('function');
  });

  it('exports exactly 2 audit hooks', async () => {
    const mod = await import('@/hooks/use-audit');
    const exportedFunctions = Object.keys(mod).filter(
      (key) => typeof mod[key as keyof typeof mod] === 'function'
    );
    expect(exportedFunctions).toHaveLength(2);
    expect(exportedFunctions).toContain('useAuditLogs');
    expect(exportedFunctions).toContain('useAuditStats');
  });
});
