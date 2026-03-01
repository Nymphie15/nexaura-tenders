'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Card, Title, Text, type EventProps } from '@tremor/react';
import { cn } from '@/lib/utils';
import { fadeInUp } from '@/lib/animations';

interface DataPoint {
  date: string;
  [key: string]: string | number;
}

interface InteractiveAreaChartProps {
  title?: string;
  subtitle?: string;
  data: DataPoint[];
  categories: string[];
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showGridLines?: boolean;
  showAnimation?: boolean;
  curveType?: 'linear' | 'natural' | 'monotone' | 'step';
  connectNulls?: boolean;
  allowDecimals?: boolean;
  className?: string;
  onValueChange?: (value: EventProps) => void;
  delay?: number;
}

const defaultValueFormatter = (value: number) => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

const defaultColors = ['indigo', 'cyan', 'emerald', 'amber', 'rose'];

export function InteractiveAreaChart({
  title,
  subtitle,
  data,
  categories,
  index,
  colors = defaultColors,
  valueFormatter = defaultValueFormatter,
  showLegend = true,
  showGridLines = true,
  showAnimation = true,
  curveType = 'monotone',
  connectNulls = false,
  allowDecimals = true,
  className,
  onValueChange,
  delay = 0,
}: InteractiveAreaChartProps) {
  const [selectedValue, setSelectedValue] = React.useState<EventProps>(null);

  const handleValueChange = (value: EventProps) => {
    setSelectedValue(value);
    onValueChange?.(value);
  };

  return (
    <motion.div
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={{ ...fadeInUp.transition, delay }}
      className={cn('', className)}
    >
      <Card className="bg-card border-border">
        {(title || subtitle) && (
          <div className="mb-4">
            {title && <Title className="text-foreground">{title}</Title>}
            {subtitle && <Text className="text-muted-foreground">{subtitle}</Text>}
          </div>
        )}
        
        <AreaChart
          data={data}
          index={index}
          categories={categories}
          colors={colors}
          valueFormatter={valueFormatter}
          showLegend={showLegend}
          showGridLines={showGridLines}
          showAnimation={showAnimation}
          curveType={curveType}
          connectNulls={connectNulls}
          allowDecimals={allowDecimals}
          onValueChange={handleValueChange}
          className="h-72 mt-4"
        />

        {selectedValue && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-muted/50"
          >
            <Text className="text-muted-foreground text-sm">
              {selectedValue[index]}
            </Text>
            <div className="flex gap-4 mt-1">
              {categories.map((cat, idx) => (
                <div key={cat} className="flex items-center gap-2">
                  <div 
                    className={cn(
                      'w-3 h-3 rounded-full',
                      `bg-${colors[idx % colors.length]}-500`
                    )} 
                  />
                  <span className="font-semibold text-foreground">
                    {valueFormatter(selectedValue[cat] as number)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}

export default InteractiveAreaChart;
