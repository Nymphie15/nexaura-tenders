import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders with default variant and size', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-variant', 'default');
      expect(button).toHaveAttribute('data-size', 'default');
    });

    it('renders children correctly', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    const variants = [
      'default',
      'destructive',
      'outline',
      'secondary',
      'ghost',
      'link',
      'glass',
      'premium',
    ] as const;

    variants.forEach((variant) => {
      it(`renders ${variant} variant`, () => {
        render(<Button variant={variant}>{variant}</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('data-variant', variant);
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['default', 'sm', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg'] as const;

    sizes.forEach((size) => {
      it(`renders ${size} size`, () => {
        render(<Button size={size}>Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('data-size', size);
      });
    });
  });

  describe('States', () => {
    it('renders disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('does not trigger onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders with type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('User Interactions', () => {
    it('handles click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard navigation', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Press me</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('prevents multiple rapid clicks with proper event handling', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click</Button>);

      const button = screen.getByRole('button');

      // Simulate rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // All clicks should register (debouncing is app-level concern)
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('has proper button role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <Button aria-describedby="help-text">Save</Button>
          <div id="help-text">This will save your changes</div>
        </>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('is keyboard accessible', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Tab to me</Button>);

      await user.tab();

      const button = screen.getByRole('button');
      expect(button).toHaveFocus();
    });

    it('has focus-visible styles', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:border-ring');
      expect(button).toHaveClass('focus-visible:ring-ring/50');
    });

    it('supports aria-invalid state', () => {
      render(<Button aria-invalid="true">Invalid</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-invalid', 'true');
      expect(button).toHaveClass('aria-invalid:border-destructive');
    });
  });

  describe('AsChild Pattern', () => {
    it('renders as child component with asChild prop', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole('link', { name: /link button/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveAttribute('data-variant', 'default');
    });
  });

  describe('Animated Variant', () => {
    it('renders with animated prop', () => {
      render(<Button animated>Animated Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-variant', 'default');
    });

    it('supports click events with animation', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button animated onClick={handleClick}>
          Animated Click
        </Button>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icon Buttons', () => {
    it('renders icon size variant', () => {
      render(<Button size="icon">🔍</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-size', 'icon');
    });

    it('renders with SVG icon', () => {
      render(
        <Button>
          <svg data-testid="test-icon" />
          Text
        </Button>
      );
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('Loading State Simulation', () => {
    it('can display loading indicator with disabled state', () => {
      render(
        <Button disabled>
          <span role="status" aria-label="Loading">
            ...
          </span>
          Loading
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('shows loading text when loading', () => {
      const { rerender } = render(<Button>Submit</Button>);

      expect(screen.getByText('Submit')).toBeInTheDocument();

      rerender(
        <Button disabled>
          <span>Loading...</span>
        </Button>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Combination Props', () => {
    it('combines variant, size, and custom className', () => {
      render(
        <Button variant="destructive" size="lg" className="extra-class">
          Delete
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-variant', 'destructive');
      expect(button).toHaveAttribute('data-size', 'lg');
      expect(button).toHaveClass('extra-class');
    });

    it('renders disabled destructive variant', () => {
      render(
        <Button variant="destructive" disabled>
          Cannot Delete
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('data-variant', 'destructive');
    });
  });
});
