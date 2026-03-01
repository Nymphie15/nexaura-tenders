/**
 * Framer Motion Animation Presets
 * Design System Premium - Appel-Offre-Automation
 */

import type { Transition, Variants } from 'framer-motion';

// Timing Functions (Cubic Bezier)
export const ease = {
  out: [0.25, 0.1, 0.25, 1.0] as const,
  in: [0.42, 0, 1, 1] as const,
  inOut: [0.42, 0, 0.58, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  elastic: [0.175, 0.885, 0.32, 1.275] as const,
  apple: [0.25, 0.46, 0.45, 0.94] as const,
};

// Duration Presets (seconds)
export const duration = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  smooth: 0.4,
  slow: 0.6,
  dramatic: 0.8,
};

// Spring Configs
export const spring = {
  snappy: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
  gentle: { type: 'spring', stiffness: 200, damping: 25 } as Transition,
  bouncy: { type: 'spring', stiffness: 300, damping: 15 } as Transition,
  wobbly: { type: 'spring', stiffness: 180, damping: 12 } as Transition,
};

// Animation Presets
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: duration.smooth, ease: ease.out },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: duration.smooth, ease: ease.out },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  transition: { duration: duration.smooth, ease: ease.out },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
  transition: { duration: duration.smooth, ease: ease.out },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: duration.normal, ease: ease.out },
};

export const scaleInBounce = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.5 },
  transition: spring.bouncy,
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration.normal },
};

export const blurIn = {
  initial: { opacity: 0, filter: 'blur(10px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(10px)' },
  transition: { duration: duration.smooth, ease: ease.out },
};

// Stagger Containers
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

// Stagger Children Variants
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.smooth, ease: ease.out },
  },
  exit: { opacity: 0, y: -10 },
};

export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: spring.gentle,
  },
};

export const staggerItemLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.smooth, ease: ease.out },
  },
};

// Interactive Animations
export const hoverScale = {
  scale: 1.02,
  transition: spring.snappy,
};

export const hoverLift = {
  y: -4,
  transition: spring.snappy,
};

export const tapScale = {
  scale: 0.98,
  transition: { duration: duration.instant },
};

export const tapPush = {
  scale: 0.95,
  y: 2,
  transition: { duration: duration.instant },
};

// Page Transitions
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.smooth,
      ease: ease.out,
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: duration.normal },
  },
};

// Skeleton Loading
export const shimmer: Variants = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Counter Animation (for KPIs)
export const counterSpring = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
  mass: 1,
};

// Utility Functions
export const getStaggerDelay = (index: number, baseDelay = 0.08): number => {
  return index * baseDelay;
};

export const withDelay = <T extends Record<string, unknown>>(
  animation: T,
  delay: number
): T & { transition: { delay: number } } => ({
  ...animation,
  transition: {
    ...(animation.transition as object),
    delay,
  },
});

export const viewportConfig = {
  once: true,
  margin: '-50px',
  amount: 0.3 as const,
};

export const getReducedMotionPreset = <T extends Record<string, unknown>>(
  animation: T
): T | { initial: object; animate: object } => {
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) {
      return { initial: {}, animate: {} };
    }
  }
  return animation;
};
