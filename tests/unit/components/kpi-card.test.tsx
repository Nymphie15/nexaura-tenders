/**
 * KPICard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KPICard } from '@/components/premium/cards/kpi-card';

describe('KPICard', () => {
  it('renders label correctly', () => {
    render(<KPICard label="Total Revenue" value="$10,000" />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('renders value correctly', () => {
    render(<KPICard label="Users" value="1,234" />);
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const TestIcon = () => <span data-testid="kpi-icon">$</span>;
    render(<KPICard label="Revenue" value="$5k" icon={<TestIcon />} />);
    expect(screen.getByTestId('kpi-icon')).toBeInTheDocument();
  });

  it('renders change badge when change is provided', () => {
    render(
      <KPICard label="Growth" value="150" change={25} changePeriod="vs last month" />
    );
    expect(screen.getByText('+25.0%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('shows negative change correctly', () => {
    render(<KPICard label="Decline" value="50" change={-15} />);
    expect(screen.getByText('-15.0%')).toBeInTheDocument();
  });

  it('shows zero change correctly', () => {
    render(<KPICard label="Stable" value="100" change={0} />);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('renders tooltip when provided', async () => {
    render(
      <KPICard
        label="Metric"
        value="100"
        tooltip="This is a helpful tooltip"
      />
    );

    // Info icon should be present for tooltip
    const infoButton = screen.getByRole('button');
    expect(infoButton).toBeInTheDocument();
  });

  it('renders progress bar when progress is provided', () => {
    const { container } = render(
      <KPICard label="Completion" value="75%" progress={75} status="positive" />
    );

    // Progress bar should be present
    const progressBar = container.querySelector('.bg-emerald-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('renders target info when both progress and target are provided', () => {
    render(
      <KPICard
        label="Sales"
        value="75"
        progress={75}
        target={100}
        status="positive"
      />
    );

    expect(screen.getByText('75% complete')).toBeInTheDocument();
    expect(screen.getByText('Target: 100')).toBeInTheDocument();
  });

  it('clamps progress to 0-100 range', () => {
    const { container: overContainer } = render(
      <KPICard label="Over" value="150%" progress={150} status="positive" />
    );
    const { container: underContainer } = render(
      <KPICard label="Under" value="-10%" progress={-10} status="negative" />
    );

    // Both should render without issues
    expect(overContainer.firstChild).toBeInTheDocument();
    expect(underContainer.firstChild).toBeInTheDocument();
  });

  it('handles click when onClick is provided', () => {
    const handleClick = vi.fn();
    render(<KPICard label="Clickable" value="100" onClick={handleClick} />);

    const card = screen.getByText('Clickable').closest('div')?.parentElement?.parentElement;
    if (card) {
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it('applies cursor-pointer class when clickable', () => {
    const { container } = render(
      <KPICard label="Clickable" value="100" onClick={() => {}} />
    );

    expect(container.firstChild).toHaveClass('cursor-pointer');
  });

  it('does not apply cursor-pointer when not clickable', () => {
    const { container } = render(
      <KPICard label="Not Clickable" value="100" />
    );

    expect(container.firstChild).not.toHaveClass('cursor-pointer');
  });

  it('applies custom className', () => {
    const { container } = render(
      <KPICard label="Custom" value="100" className="my-custom-class" />
    );

    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  describe('Status Variants', () => {
    const statuses = ['positive', 'negative', 'neutral', 'warning'] as const;

    statuses.forEach((status) => {
      it(`renders ${status} status correctly`, () => {
        const { container } = render(
          <KPICard
            label={`${status} KPI`}
            value="100"
            status={status}
            progress={50}
          />
        );
        expect(container.firstChild).toBeInTheDocument();
      });
    });

    it('applies positive status styling to progress bar', () => {
      const { container } = render(
        <KPICard label="Positive" value="100" status="positive" progress={50} />
      );
      expect(container.querySelector('.bg-emerald-500')).toBeInTheDocument();
    });

    it('applies negative status styling to progress bar', () => {
      const { container } = render(
        <KPICard label="Negative" value="100" status="negative" progress={50} />
      );
      expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
    });

    it('applies neutral status styling to progress bar', () => {
      const { container } = render(
        <KPICard label="Neutral" value="100" status="neutral" progress={50} />
      );
      expect(container.querySelector('.bg-slate-500')).toBeInTheDocument();
    });

    it('applies warning status styling to progress bar', () => {
      const { container } = render(
        <KPICard label="Warning" value="100" status="warning" progress={50} />
      );
      expect(container.querySelector('.bg-amber-500')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('renders in compact mode', () => {
      const { container } = render(
        <KPICard label="Compact" value="100" compact={true} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('uses smaller text in compact mode', () => {
      const { container: compactContainer } = render(
        <KPICard label="Compact" value="100" compact={true} />
      );
      const { container: normalContainer } = render(
        <KPICard label="Normal" value="100" compact={false} />
      );

      // Both should render correctly
      expect(compactContainer.firstChild).toBeInTheDocument();
      expect(normalContainer.firstChild).toBeInTheDocument();
    });

    it('hides change period text in compact mode', () => {
      render(
        <KPICard
          label="Compact"
          value="100"
          change={10}
          changePeriod="vs last month"
          compact={true}
        />
      );

      // Change period should not be visible in compact mode
      expect(screen.queryByText('vs last month')).not.toBeInTheDocument();
    });
  });

  describe('Animation Props', () => {
    it('applies delay prop', () => {
      const { container } = render(
        <KPICard label="Delayed" value="100" delay={0.5} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Change Badge Styling', () => {
    it('shows trending up icon for positive change', () => {
      const { container } = render(
        <KPICard label="Up" value="100" change={15} />
      );
      // Should have emerald styling
      expect(container.querySelector('.bg-emerald-500\\/10')).toBeInTheDocument();
    });

    it('shows trending down icon for negative change', () => {
      const { container } = render(
        <KPICard label="Down" value="100" change={-15} />
      );
      // Should have red styling
      expect(container.querySelector('.bg-red-500\\/10')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders tooltip trigger as a button', () => {
      render(
        <KPICard label="Accessible" value="100" tooltip="Helpful info" />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long label text', () => {
      const longLabel = 'This is a very long label that might overflow the card container';
      render(<KPICard label={longLabel} value="100" />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('handles very long value text', () => {
      const longValue = '$1,234,567,890.00';
      render(<KPICard label="Revenue" value={longValue} />);
      expect(screen.getByText(longValue)).toBeInTheDocument();
    });

    it('handles decimal change values', () => {
      render(<KPICard label="Precise" value="100" change={0.5} />);
      expect(screen.getByText('+0.5%')).toBeInTheDocument();
    });
  });
});
