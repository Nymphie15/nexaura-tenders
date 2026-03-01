/**
 * Tests unitaires pour src/lib/animations.ts
 * Tests des presets d'animation Framer Motion
 */

import { describe, it, expect } from 'vitest';
import {
  ease,
  duration,
  spring,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  scaleInBounce,
  fadeIn,
  blurIn,
  staggerContainer,
  staggerContainerFast,
  staggerContainerSlow,
  staggerItem,
  staggerItemScale,
  staggerItemLeft,
  hoverScale,
  hoverLift,
  tapScale,
  tapPush,
  pageTransition,
  shimmer,
  counterSpring,
  getStaggerDelay,
  withDelay,
  viewportConfig,
  getReducedMotionPreset,
} from '@/lib/animations';

describe('ease - timing functions', () => {
  it('should have correct cubic bezier values', () => {
    expect(ease.out).toEqual([0.25, 0.1, 0.25, 1.0]);
    expect(ease.in).toEqual([0.42, 0, 1, 1]);
    expect(ease.inOut).toEqual([0.42, 0, 0.58, 1]);
    expect(ease.bounce).toEqual([0.68, -0.55, 0.265, 1.55]);
    expect(ease.elastic).toEqual([0.175, 0.885, 0.32, 1.275]);
    expect(ease.apple).toEqual([0.25, 0.46, 0.45, 0.94]);
  });

  it('should be read-only arrays', () => {
    expect(Array.isArray(ease.out)).toBe(true);
    expect(ease.out).toHaveLength(4);
  });
});

describe('duration - timing presets', () => {
  it('should have correct duration values in seconds', () => {
    expect(duration.instant).toBe(0.1);
    expect(duration.fast).toBe(0.2);
    expect(duration.normal).toBe(0.3);
    expect(duration.smooth).toBe(0.4);
    expect(duration.slow).toBe(0.6);
    expect(duration.dramatic).toBe(0.8);
  });

  it('should have increasing values', () => {
    expect(duration.instant).toBeLessThan(duration.fast);
    expect(duration.fast).toBeLessThan(duration.normal);
    expect(duration.normal).toBeLessThan(duration.smooth);
    expect(duration.smooth).toBeLessThan(duration.slow);
    expect(duration.slow).toBeLessThan(duration.dramatic);
  });
});

describe('spring - spring configurations', () => {
  it('should have correct spring types', () => {
    expect(spring.snappy.type).toBe('spring');
    expect(spring.gentle.type).toBe('spring');
    expect(spring.bouncy.type).toBe('spring');
    expect(spring.wobbly.type).toBe('spring');
  });

  it('should have correct stiffness values', () => {
    expect(spring.snappy.stiffness).toBe(400);
    expect(spring.gentle.stiffness).toBe(200);
    expect(spring.bouncy.stiffness).toBe(300);
    expect(spring.wobbly.stiffness).toBe(180);
  });

  it('should have correct damping values', () => {
    expect(spring.snappy.damping).toBe(30);
    expect(spring.gentle.damping).toBe(25);
    expect(spring.bouncy.damping).toBe(15);
    expect(spring.wobbly.damping).toBe(12);
  });
});

describe('fadeInUp animation', () => {
  it('should have correct initial state', () => {
    expect(fadeInUp.initial).toEqual({ opacity: 0, y: 20 });
  });

  it('should have correct animate state', () => {
    expect(fadeInUp.animate).toEqual({ opacity: 1, y: 0 });
  });

  it('should have correct exit state', () => {
    expect(fadeInUp.exit).toEqual({ opacity: 0, y: -10 });
  });

  it('should use smooth duration', () => {
    expect(fadeInUp.transition.duration).toBe(duration.smooth);
  });
});

describe('fadeInDown animation', () => {
  it('should start from negative y position', () => {
    expect(fadeInDown.initial.y).toBe(-20);
  });

  it('should animate to y: 0', () => {
    expect(fadeInDown.animate.y).toBe(0);
  });
});

describe('fadeInLeft animation', () => {
  it('should start from negative x position', () => {
    expect(fadeInLeft.initial.x).toBe(-20);
  });

  it('should animate to x: 0', () => {
    expect(fadeInLeft.animate.x).toBe(0);
  });

  it('should exit with negative x', () => {
    expect(fadeInLeft.exit.x).toBe(-10);
  });
});

describe('fadeInRight animation', () => {
  it('should start from positive x position', () => {
    expect(fadeInRight.initial.x).toBe(20);
  });

  it('should animate to x: 0', () => {
    expect(fadeInRight.animate.x).toBe(0);
  });

  it('should exit with positive x', () => {
    expect(fadeInRight.exit.x).toBe(10);
  });
});

describe('scaleIn animation', () => {
  it('should start scaled down', () => {
    expect(scaleIn.initial.scale).toBe(0.95);
  });

  it('should animate to scale: 1', () => {
    expect(scaleIn.animate.scale).toBe(1);
  });

  it('should have opacity transition', () => {
    expect(scaleIn.initial.opacity).toBe(0);
    expect(scaleIn.animate.opacity).toBe(1);
  });
});

describe('scaleInBounce animation', () => {
  it('should start with smaller scale', () => {
    expect(scaleInBounce.initial.scale).toBe(0.5);
  });

  it('should use bouncy spring transition', () => {
    expect(scaleInBounce.transition).toEqual(spring.bouncy);
  });
});

describe('fadeIn animation', () => {
  it('should only animate opacity', () => {
    expect(fadeIn.initial).toEqual({ opacity: 0 });
    expect(fadeIn.animate).toEqual({ opacity: 1 });
    expect(fadeIn.exit).toEqual({ opacity: 0 });
  });

  it('should use normal duration', () => {
    expect(fadeIn.transition.duration).toBe(duration.normal);
  });
});

describe('blurIn animation', () => {
  it('should animate blur filter', () => {
    expect(blurIn.initial.filter).toBe('blur(10px)');
    expect(blurIn.animate.filter).toBe('blur(0px)');
    expect(blurIn.exit.filter).toBe('blur(10px)');
  });

  it('should also animate opacity', () => {
    expect(blurIn.initial.opacity).toBe(0);
    expect(blurIn.animate.opacity).toBe(1);
  });
});

describe('staggerContainer variants', () => {
  it('should have staggerChildren in show state', () => {
    expect(staggerContainer.show.transition?.staggerChildren).toBe(0.08);
  });

  it('should have delayChildren', () => {
    expect(staggerContainer.show.transition?.delayChildren).toBe(0.1);
  });

  it('should reverse stagger on exit', () => {
    expect(staggerContainer.exit?.transition?.staggerDirection).toBe(-1);
  });
});

describe('staggerContainerFast variants', () => {
  it('should have faster stagger than default', () => {
    expect(staggerContainerFast.show.transition?.staggerChildren).toBe(0.04);
    expect(staggerContainerFast.show.transition?.staggerChildren).toBeLessThan(
      staggerContainer.show.transition?.staggerChildren || 0
    );
  });

  it('should have shorter delay', () => {
    expect(staggerContainerFast.show.transition?.delayChildren).toBe(0.05);
  });
});

describe('staggerContainerSlow variants', () => {
  it('should have slower stagger than default', () => {
    expect(staggerContainerSlow.show.transition?.staggerChildren).toBe(0.12);
    expect(staggerContainerSlow.show.transition?.staggerChildren).toBeGreaterThan(
      staggerContainer.show.transition?.staggerChildren || 0
    );
  });

  it('should have longer delay', () => {
    expect(staggerContainerSlow.show.transition?.delayChildren).toBe(0.2);
  });
});

describe('staggerItem variants', () => {
  it('should have fadeInUp-like animation', () => {
    expect(staggerItem.hidden).toEqual({ opacity: 0, y: 20 });
    expect(staggerItem.show.opacity).toBe(1);
    expect(staggerItem.show.y).toBe(0);
  });
});

describe('staggerItemScale variants', () => {
  it('should use scale animation', () => {
    expect(staggerItemScale.hidden.scale).toBe(0.9);
    expect(staggerItemScale.show.scale).toBe(1);
  });

  it('should use gentle spring', () => {
    expect(staggerItemScale.show.transition).toEqual(spring.gentle);
  });
});

describe('staggerItemLeft variants', () => {
  it('should animate from left', () => {
    expect(staggerItemLeft.hidden.x).toBe(-20);
    expect(staggerItemLeft.show.x).toBe(0);
  });
});

describe('interactive animations', () => {
  describe('hoverScale', () => {
    it('should scale slightly up', () => {
      expect(hoverScale.scale).toBe(1.02);
    });

    it('should use snappy spring', () => {
      expect(hoverScale.transition).toEqual(spring.snappy);
    });
  });

  describe('hoverLift', () => {
    it('should move up', () => {
      expect(hoverLift.y).toBe(-4);
    });

    it('should use snappy spring', () => {
      expect(hoverLift.transition).toEqual(spring.snappy);
    });
  });

  describe('tapScale', () => {
    it('should scale down', () => {
      expect(tapScale.scale).toBe(0.98);
    });

    it('should use instant duration', () => {
      expect(tapScale.transition.duration).toBe(duration.instant);
    });
  });

  describe('tapPush', () => {
    it('should scale down and move down', () => {
      expect(tapPush.scale).toBe(0.95);
      expect(tapPush.y).toBe(2);
    });

    it('should use instant duration', () => {
      expect(tapPush.transition.duration).toBe(duration.instant);
    });
  });
});

describe('pageTransition variants', () => {
  it('should have initial, animate and exit states', () => {
    expect(pageTransition.initial).toBeDefined();
    expect(pageTransition.animate).toBeDefined();
    expect(pageTransition.exit).toBeDefined();
  });

  it('should animate before children', () => {
    expect(pageTransition.animate.transition?.when).toBe('beforeChildren');
  });

  it('should stagger children', () => {
    expect(pageTransition.animate.transition?.staggerChildren).toBe(0.1);
  });
});

describe('shimmer variants', () => {
  it('should animate background position', () => {
    expect(shimmer.initial.backgroundPosition).toBe('-200% 0');
    expect(shimmer.animate.backgroundPosition).toBe('200% 0');
  });

  it('should repeat infinitely', () => {
    expect(shimmer.animate.transition?.repeat).toBe(Infinity);
  });

  it('should use linear easing', () => {
    expect(shimmer.animate.transition?.ease).toBe('linear');
  });
});

describe('counterSpring', () => {
  it('should have spring type', () => {
    expect(counterSpring.type).toBe('spring');
  });

  it('should have appropriate values for counters', () => {
    expect(counterSpring.stiffness).toBe(100);
    expect(counterSpring.damping).toBe(20);
    expect(counterSpring.mass).toBe(1);
  });
});

describe('getStaggerDelay', () => {
  it('should calculate delay based on index', () => {
    expect(getStaggerDelay(0)).toBe(0);
    expect(getStaggerDelay(1)).toBe(0.08);
    expect(getStaggerDelay(2)).toBe(0.16);
  });

  it('should use custom base delay', () => {
    expect(getStaggerDelay(1, 0.1)).toBe(0.1);
    expect(getStaggerDelay(2, 0.1)).toBe(0.2);
  });

  it('should handle index 0', () => {
    expect(getStaggerDelay(0, 0.5)).toBe(0);
  });
});

describe('withDelay', () => {
  it('should add delay to animation', () => {
    const animation = {
      opacity: 1,
      transition: { duration: 0.3 },
    };

    const delayed = withDelay(animation, 0.5);

    expect(delayed.transition.delay).toBe(0.5);
    expect(delayed.opacity).toBe(1);
    expect(delayed.transition.duration).toBe(0.3);
  });

  it('should handle animation without existing transition', () => {
    const animation = {
      opacity: 1,
    };

    const delayed = withDelay(animation, 0.2);

    expect(delayed.transition.delay).toBe(0.2);
    expect(delayed.opacity).toBe(1);
  });

  it('should preserve other properties', () => {
    const animation = {
      opacity: 1,
      scale: 1.2,
      x: 10,
      transition: { duration: 0.3, ease: ease.out },
    };

    const delayed = withDelay(animation, 0.5);

    expect(delayed.opacity).toBe(1);
    expect(delayed.scale).toBe(1.2);
    expect(delayed.x).toBe(10);
    expect(delayed.transition.duration).toBe(0.3);
    expect(delayed.transition.ease).toEqual(ease.out);
    expect(delayed.transition.delay).toBe(0.5);
  });
});

describe('viewportConfig', () => {
  it('should trigger once', () => {
    expect(viewportConfig.once).toBe(true);
  });

  it('should have margin', () => {
    expect(viewportConfig.margin).toBe('-50px');
  });

  it('should have amount threshold', () => {
    expect(viewportConfig.amount).toBe(0.3);
  });
});

describe('getReducedMotionPreset', () => {
  beforeEach(() => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
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
  });

  it('should return animation when reduced motion is not preferred', () => {
    const animation = { initial: { opacity: 0 }, animate: { opacity: 1 } };
    const result = getReducedMotionPreset(animation);

    expect(result).toEqual(animation);
  });

  it('should return empty animations when reduced motion is preferred', () => {
    // Mock prefers-reduced-motion: reduce
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const animation = { initial: { opacity: 0 }, animate: { opacity: 1 } };
    const result = getReducedMotionPreset(animation);

    expect(result.initial).toEqual({});
    expect(result.animate).toEqual({});
  });

  it('should preserve animation properties when not reducing motion', () => {
    const animation = {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0 },
    };

    const result = getReducedMotionPreset(animation);
    expect(result).toEqual(animation);
  });
});

describe('Animation consistency', () => {
  it('should have consistent opacity transitions', () => {
    const fadeAnimations = [fadeIn, fadeInUp, fadeInDown, fadeInLeft, fadeInRight, scaleIn];

    fadeAnimations.forEach(anim => {
      expect(anim.initial.opacity).toBe(0);
      expect(anim.animate.opacity).toBe(1);
    });
  });

  it('should use consistent easing for fade animations', () => {
    const animations = [fadeInUp, fadeInDown, fadeInLeft, fadeInRight, blurIn];

    animations.forEach(anim => {
      expect(anim.transition.ease).toEqual(ease.out);
    });
  });

  it('should have sensible scale values', () => {
    expect(scaleIn.initial.scale).toBeGreaterThan(0);
    expect(scaleIn.initial.scale).toBeLessThan(1);
    expect(scaleIn.animate.scale).toBe(1);

    expect(scaleInBounce.initial.scale).toBeGreaterThan(0);
    expect(scaleInBounce.initial.scale).toBeLessThan(1);
  });
});
