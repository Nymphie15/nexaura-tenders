'use client';

import * as React from 'react';
import { motion, useAnimation, PanInfo, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Trash2, Archive, Star, Edit, MoreHorizontal } from 'lucide-react';

// ============================================
// Types
// ============================================

export interface SwipeAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface SwipeActionsProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  className?: string;
  disabled?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

// ============================================
// Default Actions
// ============================================

export const defaultLeftActions: SwipeAction[] = [
  {
    id: 'star',
    icon: <Star className="w-5 h-5" />,
    label: 'Favoris',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/20',
    onClick: () => {},
  },
  {
    id: 'archive',
    icon: <Archive className="w-5 h-5" />,
    label: 'Archiver',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    onClick: () => {},
  },
];

export const defaultRightActions: SwipeAction[] = [
  {
    id: 'edit',
    icon: <Edit className="w-5 h-5" />,
    label: 'Modifier',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/20',
    onClick: () => {},
  },
  {
    id: 'delete',
    icon: <Trash2 className="w-5 h-5" />,
    label: 'Supprimer',
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    onClick: () => {},
  },
];

// ============================================
// Constants
// ============================================

const ACTION_WIDTH = 80;
const VELOCITY_THRESHOLD = 500;

const springConfig = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 40,
};

// ============================================
// Action Button Component
// ============================================

interface ActionButtonProps {
  action: SwipeAction;
  index: number;
  side: 'left' | 'right';
  totalActions: number;
  revealProgress: number;
}

function ActionButton({ action, index, side, totalActions, revealProgress }: ActionButtonProps) {
  const isRevealed = revealProgress > 0.3;

  return (
    <motion.button
      onClick={(e) => {
        e.stopPropagation();
        action.onClick();
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: isRevealed ? 1 : 0.8,
        opacity: isRevealed ? 1 : 0,
      }}
      transition={{
        ...springConfig,
        delay: isRevealed ? index * 0.05 : (totalActions - index - 1) * 0.03,
      }}
      className={cn(
        'flex flex-col items-center justify-center',
        'h-full px-4 min-w-[70px]',
        action.bgColor,
        action.color,
        'transition-colors hover:opacity-80 active:opacity-60'
      )}
    >
      <motion.div
        animate={{
          scale: revealProgress > 0.7 ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        {action.icon}
      </motion.div>
      <span className="text-xs font-medium mt-1">{action.label}</span>
    </motion.button>
  );
}

// ============================================
// Main Component
// ============================================

export function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 0.4,
  className,
  disabled = false,
  onSwipeStart,
  onSwipeEnd,
}: SwipeActionsProps) {
  const controls = useAnimation();
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragDirection, setDragDirection] = React.useState<'left' | 'right' | null>(null);
  const [revealProgress, setRevealProgress] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const leftActionsWidth = leftActions.length * ACTION_WIDTH;
  const rightActionsWidth = rightActions.length * ACTION_WIDTH;

  // Handle drag
  const handleDrag = React.useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset } = info;

    if (offset.x > 10 && leftActions.length > 0) {
      setDragDirection('right');
      const progress = Math.min(offset.x / leftActionsWidth, 1);
      setRevealProgress(progress);
    } else if (offset.x < -10 && rightActions.length > 0) {
      setDragDirection('left');
      const progress = Math.min(Math.abs(offset.x) / rightActionsWidth, 1);
      setRevealProgress(progress);
    } else {
      setDragDirection(null);
      setRevealProgress(0);
    }
  }, [leftActions.length, rightActions.length, leftActionsWidth, rightActionsWidth]);

  // Handle drag end
  const handleDragEnd = React.useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { velocity, offset } = info;
    setIsDragging(false);
    onSwipeEnd?.();

    const shouldRevealLeft =
      (offset.x > leftActionsWidth * threshold || velocity.x > VELOCITY_THRESHOLD) &&
      leftActions.length > 0;

    const shouldRevealRight =
      (offset.x < -rightActionsWidth * threshold || velocity.x < -VELOCITY_THRESHOLD) &&
      rightActions.length > 0;

    if (shouldRevealLeft) {
      controls.start({ x: leftActionsWidth, transition: springConfig });
      setDragDirection('right');
      setRevealProgress(1);
    } else if (shouldRevealRight) {
      controls.start({ x: -rightActionsWidth, transition: springConfig });
      setDragDirection('left');
      setRevealProgress(1);
    } else {
      controls.start({ x: 0, transition: springConfig });
      setDragDirection(null);
      setRevealProgress(0);
    }
  }, [controls, leftActions.length, rightActions.length, leftActionsWidth, rightActionsWidth, threshold, onSwipeEnd]);

  // Reset on click outside
  const handleClickOutside = React.useCallback(() => {
    if (dragDirection) {
      controls.start({ x: 0, transition: springConfig });
      setDragDirection(null);
      setRevealProgress(0);
    }
  }, [controls, dragDirection]);

  // Close when clicking content (if actions are revealed)
  const handleContentClick = React.useCallback(() => {
    if (dragDirection) {
      controls.start({ x: 0, transition: springConfig });
      setDragDirection(null);
      setRevealProgress(0);
    }
  }, [controls, dragDirection]);

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Left Actions (revealed when swiping right) */}
      {leftActions.length > 0 && (
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 flex',
            'overflow-hidden'
          )}
          style={{ width: leftActionsWidth }}
        >
          {leftActions.map((action, index) => (
            <ActionButton
              key={action.id}
              action={action}
              index={index}
              side="left"
              totalActions={leftActions.length}
              revealProgress={dragDirection === 'right' ? revealProgress : 0}
            />
          ))}
        </div>
      )}

      {/* Right Actions (revealed when swiping left) */}
      {rightActions.length > 0 && (
        <div
          className={cn(
            'absolute right-0 top-0 bottom-0 flex',
            'overflow-hidden'
          )}
          style={{ width: rightActionsWidth }}
        >
          {rightActions.map((action, index) => (
            <ActionButton
              key={action.id}
              action={action}
              index={index}
              side="right"
              totalActions={rightActions.length}
              revealProgress={dragDirection === 'left' ? revealProgress : 0}
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      <motion.div
        drag="x"
        dragConstraints={{
          left: rightActions.length > 0 ? -rightActionsWidth : 0,
          right: leftActions.length > 0 ? leftActionsWidth : 0,
        }}
        dragElastic={0.1}
        onDragStart={() => {
          setIsDragging(true);
          onSwipeStart?.();
        }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        onClick={handleContentClick}
        className={cn(
          'relative bg-background z-10',
          isDragging && 'cursor-grabbing'
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ============================================
// Swipeable List Item Component
// ============================================

interface SwipeableListItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
  onStar?: () => void;
  onEdit?: () => void;
  className?: string;
}

export function SwipeableListItem({
  children,
  onDelete,
  onArchive,
  onStar,
  onEdit,
  className,
}: SwipeableListItemProps) {
  const leftActions: SwipeAction[] = [];
  const rightActions: SwipeAction[] = [];

  if (onStar) {
    leftActions.push({
      id: 'star',
      icon: <Star className="w-5 h-5" />,
      label: 'Favoris',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/20',
      onClick: onStar,
    });
  }

  if (onArchive) {
    leftActions.push({
      id: 'archive',
      icon: <Archive className="w-5 h-5" />,
      label: 'Archiver',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
      onClick: onArchive,
    });
  }

  if (onEdit) {
    rightActions.push({
      id: 'edit',
      icon: <Edit className="w-5 h-5" />,
      label: 'Modifier',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/20',
      onClick: onEdit,
    });
  }

  if (onDelete) {
    rightActions.push({
      id: 'delete',
      icon: <Trash2 className="w-5 h-5" />,
      label: 'Supprimer',
      color: 'text-red-500',
      bgColor: 'bg-red-500/20',
      onClick: onDelete,
    });
  }

  return (
    <SwipeActions
      leftActions={leftActions}
      rightActions={rightActions}
      className={className}
    >
      {children}
    </SwipeActions>
  );
}

export default SwipeActions;
