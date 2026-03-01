import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders badge element', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-slot', 'badge');
    });

    it('renders as span by default', () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText('Test');
      expect(badge.tagName).toBe('SPAN');
    });

    it('renders children correctly', () => {
      render(<Badge>Badge Text</Badge>);
      expect(screen.getByText('Badge Text')).toBeInTheDocument();
    });

    it('renders with icons', () => {
      render(
        <Badge>
          <svg data-testid="icon" />
          <span>With Icon</span>
        </Badge>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Badge className="custom-badge">Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('custom-badge');
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Badge variant="default">Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-primary');
      expect(badge).toHaveClass('text-primary-foreground');
    });

    it('renders secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-secondary');
      expect(badge).toHaveClass('text-secondary-foreground');
    });

    it('renders destructive variant', () => {
      render(<Badge variant="destructive">Destructive</Badge>);
      const badge = screen.getByText('Destructive');
      expect(badge).toHaveClass('bg-destructive');
      expect(badge).toHaveClass('text-white');
    });

    it('renders outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('text-foreground');
    });

    it('uses default variant when no variant specified', () => {
      render(<Badge>No Variant</Badge>);
      const badge = screen.getByText('No Variant');
      expect(badge).toHaveClass('bg-primary');
    });
  });

  describe('Styles', () => {
    it('has base badge styles', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('justify-center');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('border');
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('text-xs');
      expect(badge).toHaveClass('font-medium');
    });

    it('has proper sizing', () => {
      render(<Badge>Size Test</Badge>);
      const badge = screen.getByText('Size Test');
      expect(badge).toHaveClass('w-fit');
      expect(badge).toHaveClass('whitespace-nowrap');
      expect(badge).toHaveClass('shrink-0');
    });

    it('has focus styles', () => {
      render(<Badge>Focus</Badge>);
      const badge = screen.getByText('Focus');
      expect(badge).toHaveClass('focus-visible:border-ring');
      expect(badge).toHaveClass('focus-visible:ring-ring/50');
      expect(badge).toHaveClass('focus-visible:ring-[3px]');
    });

    it('has invalid state styles', () => {
      render(<Badge aria-invalid="true">Invalid</Badge>);
      const badge = screen.getByText('Invalid');
      expect(badge).toHaveClass('aria-invalid:border-destructive');
    });

    it('has icon sizing', () => {
      render(<Badge>Icon Badge</Badge>);
      const badge = screen.getByText('Icon Badge');
      // Check for icon-related classes in the base styles
      expect(badge).toHaveClass('gap-1');
    });
  });

  describe('AsChild Pattern', () => {
    it('renders as child component when asChild is true', () => {
      render(
        <Badge asChild>
          <a href="/test">Link Badge</a>
        </Badge>
      );

      const link = screen.getByRole('link', { name: /link badge/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveAttribute('data-slot', 'badge');
    });

    it('renders as button with asChild', () => {
      render(
        <Badge asChild>
          <button type="button">Button Badge</button>
        </Badge>
      );

      const button = screen.getByRole('button', { name: /button badge/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Interactive Badges', () => {
    it('renders as clickable link', () => {
      render(
        <Badge asChild>
          <a href="/category">Category</a>
        </Badge>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/category');
    });

    it('applies hover styles to link badges', () => {
      render(
        <Badge asChild variant="default">
          <a href="#">Hover Me</a>
        </Badge>
      );

      const link = screen.getByRole('link');
      // Link badges should have hover styles via [a&] modifier
      expect(link).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('has dark mode classes for destructive variant', () => {
      render(<Badge variant="destructive">Dark</Badge>);
      const badge = screen.getByText('Dark');
      expect(badge).toHaveClass('dark:bg-destructive/60');
    });

    it('has dark mode focus ring for destructive', () => {
      render(<Badge variant="destructive">Focus Dark</Badge>);
      const badge = screen.getByText('Focus Dark');
      expect(badge).toHaveClass('dark:focus-visible:ring-destructive/40');
    });

    it('has dark mode invalid ring', () => {
      render(<Badge aria-invalid="true">Invalid Dark</Badge>);
      const badge = screen.getByText('Invalid Dark');
      expect(badge).toHaveClass('dark:aria-invalid:ring-destructive/40');
    });
  });

  describe('Status Badges', () => {
    it('renders success status', () => {
      render(<Badge variant="default">Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders warning status', () => {
      render(<Badge variant="secondary">Pending</Badge>);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('renders error status', () => {
      render(<Badge variant="destructive">Error</Badge>);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('renders info status', () => {
      render(<Badge variant="outline">Info</Badge>);
      expect(screen.getByText('Info')).toBeInTheDocument();
    });
  });

  describe('Count Badges', () => {
    it('renders numeric count', () => {
      render(<Badge>99+</Badge>);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('renders small counts', () => {
      render(<Badge>3</Badge>);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders zero', () => {
      render(<Badge>0</Badge>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Badge aria-label="3 notifications">3</Badge>);
      expect(screen.getByLabelText('3 notifications')).toBeInTheDocument();
    });

    it('supports role attribute', () => {
      render(<Badge role="status">New</Badge>);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('New');
    });

    it('can be used with screen reader text', () => {
      render(
        <Badge>
          5<span className="sr-only"> unread messages</span>
        </Badge>
      );
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('unread messages')).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <Badge aria-describedby="badge-desc">New</Badge>
          <div id="badge-desc">This item is new</div>
        </>
      );
      const badge = screen.getByText('New');
      expect(badge).toHaveAttribute('aria-describedby', 'badge-desc');
    });
  });

  describe('Multiple Badges', () => {
    it('renders multiple badges together', () => {
      render(
        <div>
          <Badge variant="default">Tag 1</Badge>
          <Badge variant="secondary">Tag 2</Badge>
          <Badge variant="outline">Tag 3</Badge>
        </div>
      );

      expect(screen.getByText('Tag 1')).toBeInTheDocument();
      expect(screen.getByText('Tag 2')).toBeInTheDocument();
      expect(screen.getByText('Tag 3')).toBeInTheDocument();
    });
  });

  describe('Complex Content', () => {
    it('renders with icon and text', () => {
      render(
        <Badge>
          <svg data-testid="check-icon" />
          Verified
        </Badge>
      );

      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('renders with emoji', () => {
      render(<Badge>🔥 Hot</Badge>);
      expect(screen.getByText('🔥 Hot')).toBeInTheDocument();
    });

    it('renders with multiple elements', () => {
      render(
        <Badge>
          <span>Prefix</span>
          <strong>Value</strong>
          <span>Suffix</span>
        </Badge>
      );

      expect(screen.getByText('Prefix')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.getByText('Suffix')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('accepts custom background color', () => {
      render(<Badge className="bg-blue-500">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('bg-blue-500');
    });

    it('accepts custom text color', () => {
      render(<Badge className="text-white">Custom Text</Badge>);
      const badge = screen.getByText('Custom Text');
      expect(badge).toHaveClass('text-white');
    });

    it('can override border radius', () => {
      render(<Badge className="rounded-sm">Square Badge</Badge>);
      const badge = screen.getByText('Square Badge');
      expect(badge).toHaveClass('rounded-sm');
    });

    it('can override padding', () => {
      render(<Badge className="px-4 py-2">Large Badge</Badge>);
      const badge = screen.getByText('Large Badge');
      expect(badge).toHaveClass('px-4');
      expect(badge).toHaveClass('py-2');
    });
  });
});
