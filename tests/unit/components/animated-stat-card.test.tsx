/**
 * AnimatedStatCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedStatCard } from '@/components/premium/cards/animated-stat-card';

// Mock framer-motion useMotionValue and useTransform
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: 'div',
      span: 'span',
      polyline: 'polyline',
    },
    useMotionValue: (initial: number) => ({
      get: () => initial,
      set: vi.fn(),
      on: vi.fn(() => vi.fn()),
    }),
    useTransform: () => ({
      get: () => '0',
      set: vi.fn(),
      on: vi.fn(() => vi.fn()),
    }),
    animate: vi.fn(() => ({ stop: vi.fn() })),
  };
});

describe('AnimatedStatCard', () => {
  it('renders title correctly', () => {
    render(<AnimatedStatCard title="Total Sales" value={1000} />);
    expect(screen.getByText('Total Sales')).toBeInTheDocument();
  });

  it('renders value with prefix', () => {
    render(<AnimatedStatCard title="Revenue" value={5000} prefix="$" />);
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('renders value with suffix', () => {
    render(<AnimatedStatCard title="Users" value={100} suffix="k" />);
    expect(screen.getByText('k')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <AnimatedStatCard
        title="Metric"
        value={50}
        description="Last 30 days"
      />
    );
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    render(<AnimatedStatCard title="Stats" value={100} icon={<TestIcon />} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('applies different accent styles', () => {
    const { container: primaryContainer } = render(
      <AnimatedStatCard title="Primary" value={100} accent="primary" />
    );
    const { container: successContainer } = render(
      <AnimatedStatCard title="Success" value={100} accent="success" />
    );

    // Both should render without errors
    expect(primaryContainer.firstChild).toBeInTheDocument();
    expect(successContainer.firstChild).toBeInTheDocument();
  });

  it('renders sparkline when data is provided', () => {
    const { container } = render(
      <AnimatedStatCard
        title="Trend"
        value={100}
        sparklineData={[10, 20, 15, 30, 25]}
      />
    );

    // Sparkline SVG should be present
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('does not render sparkline with insufficient data', () => {
    const { container } = render(
      <AnimatedStatCard title="Trend" value={100} sparklineData={[10]} />
    );

    // Should not have sparkline with only 1 data point
    const polyline = container.querySelector('polyline');
    expect(polyline).toBeNull();
  });

  it('renders trend indicator when previousValue is provided', () => {
    render(
      <AnimatedStatCard title="Growth" value={150} previousValue={100} />
    );

    // Should show percentage change
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('shows positive trend for increase', () => {
    const { container } = render(
      <AnimatedStatCard title="Growth" value={200} previousValue={100} />
    );

    // Should have emerald color class for positive trend
    const trendDiv = container.querySelector('.text-emerald-500, .dark\\:text-emerald-400');
    expect(trendDiv).toBeInTheDocument();
  });

  it('shows negative trend for decrease', () => {
    const { container } = render(
      <AnimatedStatCard title="Decline" value={50} previousValue={100} />
    );

    // Should have red color class for negative trend
    const trendDiv = container.querySelector('.text-red-500, .dark\\:text-red-400');
    expect(trendDiv).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnimatedStatCard title="Custom" value={100} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies delay prop', () => {
    const { container } = render(
      <AnimatedStatCard title="Delayed" value={100} delay={0.5} />
    );

    // Component should render with delay prop applied
    expect(container.firstChild).toBeInTheDocument();
  });

  it('handles hover prop', () => {
    const { container: hoverEnabled } = render(
      <AnimatedStatCard title="Hover" value={100} hover={true} />
    );
    const { container: hoverDisabled } = render(
      <AnimatedStatCard title="No Hover" value={100} hover={false} />
    );

    expect(hoverEnabled.firstChild).toBeInTheDocument();
    expect(hoverDisabled.firstChild).toBeInTheDocument();
  });

  describe('Accent Variants', () => {
    const accents = ['primary', 'success', 'warning', 'destructive', 'info'] as const;

    accents.forEach((accent) => {
      it(`renders ${accent} accent correctly`, () => {
        const { container } = render(
          <AnimatedStatCard title={`${accent} card`} value={100} accent={accent} />
        );
        expect(container.firstChild).toBeInTheDocument();
      });
    });
  });

  describe('Number Formatting', () => {
    it('handles zero value', () => {
      render(<AnimatedStatCard title="Zero" value={0} />);
      // The animated counter starts at 0
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles decimal values with decimals prop', () => {
      render(<AnimatedStatCard title="Decimal" value={99.99} decimals={2} />);
      // The component should handle decimals
      expect(screen.getByText('Decimal')).toBeInTheDocument();
    });

    it('handles large numbers', () => {
      render(<AnimatedStatCard title="Large" value={1000000} />);
      expect(screen.getByText('Large')).toBeInTheDocument();
    });

    it('handles negative numbers', () => {
      render(<AnimatedStatCard title="Negative" value={-50} />);
      expect(screen.getByText('Negative')).toBeInTheDocument();
    });
  });

  describe('Trend Indicator Edge Cases', () => {
    it('handles zero previousValue', () => {
      render(<AnimatedStatCard title="From Zero" value={100} previousValue={0} />);
      // Should show 0% change when previous is 0
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('handles same value as previous', () => {
      render(<AnimatedStatCard title="No Change" value={100} previousValue={100} />);
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });
  });
});
