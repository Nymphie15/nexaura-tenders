'use client';

import * as React from 'react';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================
// Types
// ============================================

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  /** Snap points as percentages: 0.25 = 25%, 0.5 = 50%, 0.9 = 90% */
  snapPoints?: number[];
  /** Initial snap index (0-based) */
  initialSnap?: number;
  /** Show close button */
  showCloseButton?: boolean;
  /** Allow backdrop click to close */
  closeOnBackdropClick?: boolean;
  className?: string;
}

// ============================================
// Constants
// ============================================

const DEFAULT_SNAP_POINTS = [0.25, 0.5, 0.9]; // 25%, 50%, 90%
const VELOCITY_THRESHOLD = 300;
const DRAG_THRESHOLD = 50;

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 40,
  mass: 1,
};

// ============================================
// Main Component
// ============================================

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  description,
  snapPoints = DEFAULT_SNAP_POINTS,
  initialSnap = 1,
  showCloseButton = true,
  closeOnBackdropClick = true,
  className,
}: BottomSheetProps) {
  const [currentSnapIndex, setCurrentSnapIndex] = React.useState(initialSnap);
  const controls = useAnimation();
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = React.useState(0);

  // Get viewport height on mount and resize
  React.useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.innerHeight);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Calculate height from snap point
  const getHeight = React.useCallback((snapIndex: number): number => {
    const snap = snapPoints[snapIndex] ?? snapPoints[0];
    return viewportHeight * snap;
  }, [snapPoints, viewportHeight]);

  // Animate to snap point
  const animateToSnap = React.useCallback(
    (snapIndex: number) => {
      const clampedIndex = Math.max(0, Math.min(snapIndex, snapPoints.length - 1));
      setCurrentSnapIndex(clampedIndex);
      controls.start({
        height: getHeight(clampedIndex),
        transition: springConfig,
      });
    },
    [controls, snapPoints.length, getHeight]
  );

  // Handle drag end
  const handleDragEnd = React.useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { velocity, offset } = info;

    // Dragged down fast - close or go to lower snap
    if (velocity.y > VELOCITY_THRESHOLD || offset.y > DRAG_THRESHOLD) {
      if (currentSnapIndex === 0) {
        onClose();
      } else {
        animateToSnap(currentSnapIndex - 1);
      }
      return;
    }

    // Dragged up fast - go to higher snap
    if (velocity.y < -VELOCITY_THRESHOLD || offset.y < -DRAG_THRESHOLD) {
      animateToSnap(Math.min(currentSnapIndex + 1, snapPoints.length - 1));
      return;
    }

    // Find nearest snap based on current position
    if (sheetRef.current) {
      const currentHeight = sheetRef.current.getBoundingClientRect().height;
      const currentPercent = currentHeight / viewportHeight;

      let nearestIndex = 0;
      let minDistance = Math.abs(snapPoints[0] - currentPercent);

      snapPoints.forEach((snap, index) => {
        const distance = Math.abs(snap - currentPercent);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = index;
        }
      });

      animateToSnap(nearestIndex);
    }
  }, [currentSnapIndex, snapPoints, viewportHeight, animateToSnap, onClose]);

  // Reset on open
  React.useEffect(() => {
    if (isOpen && viewportHeight > 0) {
      setCurrentSnapIndex(initialSnap);
      controls.set({ height: getHeight(initialSnap) });
    }
  }, [isOpen, initialSnap, viewportHeight, controls, getHeight]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  if (viewportHeight === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
            className={cn(
              'fixed inset-0 z-40',
              'bg-black/40 backdrop-blur-sm',
              'md:hidden'
            )}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0, height: getHeight(currentSnapIndex) }}
            exit={{ y: '100%' }}
            transition={springConfig}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{ height: getHeight(currentSnapIndex) }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-background rounded-t-3xl',
              'shadow-2xl shadow-black/20',
              'flex flex-col overflow-hidden',
              'md:hidden',
              'touch-none',
              className
            )}
          >
            {/* Drag Handle */}
            <div
              className={cn(
                'flex justify-center items-center py-3',
                'cursor-grab active:cursor-grabbing',
                'touch-none select-none'
              )}
            >
              <motion.div
                className="flex flex-col items-center gap-1"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
                <GripHorizontal className="w-4 h-4 text-muted-foreground/30" />
              </motion.div>
            </div>

            {/* Header */}
            {(title || description || showCloseButton) && (
              <div className="flex items-start justify-between px-5 pb-4">
                <div className="flex-1">
                  {title && (
                    <motion.h2
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-lg font-semibold text-foreground"
                    >
                      {title}
                    </motion.h2>
                  )}
                  {description && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="text-sm text-muted-foreground mt-1"
                    >
                      {description}
                    </motion.p>
                  )}
                </div>
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="shrink-0 -mr-2 -mt-1 h-9 w-9 rounded-full hover:bg-muted"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-safe">
              {children}
            </div>

            {/* Snap Point Indicators */}
            <div className="absolute top-16 right-4 flex flex-col gap-1.5">
              {snapPoints.map((snap, index) => (
                <motion.button
                  key={index}
                  onClick={() => animateToSnap(index)}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-200',
                    currentSnapIndex === index
                      ? 'bg-primary scale-125'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  )}
                  aria-label={`Snap to ${Math.round(snap * 100)}%`}
                />
              ))}
            </div>

            {/* Bottom gradient for scroll indication */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BottomSheet;
