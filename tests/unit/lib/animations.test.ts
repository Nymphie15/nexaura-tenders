/**
 * Animations Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  ease,
  duration,
  spring,
  fadeInUp,
  fadeInDown,
  scaleIn,
  staggerContainer,
  staggerItem,
  getStaggerDelay,
  withDelay,
} from '@/lib/animations';

describe('Animation Easing', () => {
  it('has correct ease out values', () => {
    expect(ease.out).toEqual([0.25, 0.1, 0.25, 1.0]);
  });

  it('has correct ease in values', () => {
    expect(ease.in).toEqual([0.42, 0, 1, 1]);
  });

  it('has correct ease inOut values', () => {
    expect(ease.inOut).toEqual([0.42, 0, 0.58, 1]);
  });

  it('has bounce easing for attention effects', () => {
    expect(ease.bounce).toBeDefined();
    expect(ease.bounce.length).toBe(4);
  });
});

describe('Animation Durations', () => {
  it('has instant duration less than fast', () => {
    expect(duration.instant).toBeLessThan(duration.fast);
  });

  it('has progressive duration values', () => {
    expect(duration.fast).toBeLessThan(duration.normal);
    expect(duration.normal).toBeLessThan(duration.smooth);
    expect(duration.smooth).toBeLessThan(duration.slow);
    expect(duration.slow).toBeLessThan(duration.dramatic);
  });

  it('has reasonable duration values in seconds', () => {
    expect(duration.instant).toBe(0.1);
    expect(duration.normal).toBe(0.3);
    expect(duration.dramatic).toBe(0.8);
  });
});

describe('Spring Configurations', () => {
  it('has snappy spring for buttons', () => {
    expect(spring.snappy).toHaveProperty('type', 'spring');
    expect(spring.snappy).toHaveProperty('stiffness');
    expect(spring.snappy).toHaveProperty('damping');
  });

  it('has gentle spring for cards', () => {
    expect(spring.gentle).toHaveProperty('type', 'spring');
    expect(spring.gentle.stiffness).toBeLessThan(spring.snappy.stiffness as number);
  });

  it('has bouncy spring for notifications', () => {
    expect(spring.bouncy).toHaveProperty('type', 'spring');
    expect(spring.bouncy.damping).toBeLessThan(spring.gentle.damping as number);
  });
});

describe('Animation Presets', () => {
  it('fadeInUp has correct initial state', () => {
    expect(fadeInUp.initial).toEqual({ opacity: 0, y: 20 });
  });

  it('fadeInUp animates to visible state', () => {
    expect(fadeInUp.animate).toEqual({ opacity: 1, y: 0 });
  });

  it('fadeInDown has opposite direction', () => {
    expect(fadeInDown.initial.y).toBe(-20);
    expect(fadeInUp.initial.y).toBe(20);
  });

  it('scaleIn uses scale transform', () => {
    expect(scaleIn.initial).toHaveProperty('scale', 0.95);
    expect(scaleIn.animate).toHaveProperty('scale', 1);
  });
});

describe('Stagger Animations', () => {
  it('staggerContainer has correct structure', () => {
    expect(staggerContainer.hidden).toHaveProperty('opacity', 0);
    expect(staggerContainer.show).toHaveProperty('opacity', 1);
  });

  it('staggerContainer has stagger children timing', () => {
    const show = staggerContainer.show as { transition: { staggerChildren: number } };
    expect(show.transition).toHaveProperty('staggerChildren');
    expect(show.transition.staggerChildren).toBeGreaterThan(0);
  });

  it('staggerItem has hidden and show states', () => {
    expect(staggerItem.hidden).toBeDefined();
    expect(staggerItem.show).toBeDefined();
  });
});

describe('Utility Functions', () => {
  it('getStaggerDelay calculates correct delay', () => {
    expect(getStaggerDelay(0)).toBe(0);
    expect(getStaggerDelay(1)).toBe(0.08);
    expect(getStaggerDelay(5)).toBe(0.4);
  });

  it('getStaggerDelay uses custom base delay', () => {
    expect(getStaggerDelay(2, 0.1)).toBeCloseTo(0.2);
    expect(getStaggerDelay(3, 0.05)).toBeCloseTo(0.15);
  });

  it('withDelay adds delay to animation', () => {
    const delayed = withDelay(fadeInUp, 0.5);
    expect(delayed.transition.delay).toBe(0.5);
    expect(delayed.initial).toEqual(fadeInUp.initial);
    expect(delayed.animate).toEqual(fadeInUp.animate);
  });
});
