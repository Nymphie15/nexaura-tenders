'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  fillOpacity?: number;
  showFill?: boolean;
  showDots?: boolean;
  animate?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  strokeWidth = 2,
  color = 'currentColor',
  fillOpacity = 0.1,
  showFill = true,
  showDots = false,
  animate = true,
  className,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div 
        className={cn('flex items-center justify-center text-muted-foreground', className)}
        style={{ width, height }}
      >
        <span className="text-xs">No data</span>
      </div>
    );
  }

  const padding = strokeWidth;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = height - padding - ((value - min) / range) * chartHeight;
    return { x, y, value };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  const isPositive = data[data.length - 1] >= data[0];
  const defaultColor = isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
  const strokeColor = color === 'currentColor' ? defaultColor : color;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      style={{ width, height }}
    >
      {showFill && (
        <motion.path
          d={areaPath}
          fill={strokeColor}
          fillOpacity={fillOpacity}
          initial={animate ? { opacity: 0 } : undefined}
          animate={animate ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
      )}

      <motion.path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {showDots && points.map((point, index) => (
        <motion.circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={strokeWidth + 1}
          fill={strokeColor}
          initial={animate ? { scale: 0, opacity: 0 } : undefined}
          animate={animate ? { scale: 1, opacity: 1 } : undefined}
          transition={{ delay: 0.8 + index * 0.05, duration: 0.2 }}
        />
      ))}

      {/* Last point highlight */}
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={strokeWidth + 2}
        fill={strokeColor}
        initial={animate ? { scale: 0 } : undefined}
        animate={animate ? { scale: 1 } : undefined}
        transition={{ delay: 1, type: 'spring', stiffness: 300, damping: 15 }}
      />
    </svg>
  );
}

export default Sparkline;
