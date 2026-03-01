/**
 * GlassCard Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardFooter } from '@/components/premium/cards/glass-card';

describe('GlassCard', () => {
  it('renders children correctly', () => {
    render(<GlassCard>Test Content</GlassCard>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    const card = container.firstChild;
    expect(card).toHaveClass('backdrop-blur-xl');
  });

  it('applies custom className', () => {
    const { container } = render(<GlassCard className="custom-class">Content</GlassCard>);
    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('applies different size classes', () => {
    const { container: smContainer } = render(<GlassCard size="sm">Small</GlassCard>);
    const { container: lgContainer } = render(<GlassCard size="lg">Large</GlassCard>);

    expect(smContainer.firstChild).toHaveClass('p-4');
    expect(lgContainer.firstChild).toHaveClass('p-8');
  });

  it('applies different variant classes', () => {
    const { container: subtleContainer } = render(<GlassCard variant="subtle">Subtle</GlassCard>);
    const { container: strongContainer } = render(<GlassCard variant="strong">Strong</GlassCard>);

    expect(subtleContainer.firstChild).toHaveClass('bg-white/50');
    expect(strongContainer.firstChild).toHaveClass('bg-white/90');
  });
});

describe('GlassCardHeader', () => {
  it('renders title correctly', () => {
    render(<GlassCardHeader title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders description correctly', () => {
    render(<GlassCardHeader title="Title" description="Test Description" />);
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders action element', () => {
    render(<GlassCardHeader title="Title" action={<button>Action</button>} />);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});

describe('GlassCardContent', () => {
  it('renders children correctly', () => {
    render(<GlassCardContent>Content Body</GlassCardContent>);
    expect(screen.getByText('Content Body')).toBeInTheDocument();
  });
});

describe('GlassCardFooter', () => {
  it('renders children correctly', () => {
    render(<GlassCardFooter>Footer Content</GlassCardFooter>);
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('has border styling', () => {
    const { container } = render(<GlassCardFooter>Footer</GlassCardFooter>);
    expect(container.firstChild).toHaveClass('border-t');
  });
});

describe('Compound GlassCard', () => {
  it('renders complete card structure', () => {
    render(
      <GlassCard>
        <GlassCard.Header title="Card Title" description="Card description" />
        <GlassCard.Content>Main content here</GlassCard.Content>
        <GlassCard.Footer>Footer actions</GlassCard.Footer>
      </GlassCard>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
    expect(screen.getByText('Main content here')).toBeInTheDocument();
    expect(screen.getByText('Footer actions')).toBeInTheDocument();
  });
});
