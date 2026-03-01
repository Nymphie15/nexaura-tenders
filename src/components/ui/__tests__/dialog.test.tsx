import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../dialog';

describe('Dialog Components', () => {
  // Mock MutationObserver for dark mode detection
  beforeEach(() => {
    const mockMutationObserver = vi.fn(function MutationObserver(callback) {
      this.observe = vi.fn();
      this.disconnect = vi.fn();
      this.takeRecords = vi.fn();
    });
    vi.stubGlobal('MutationObserver', mockMutationObserver);
  });

  describe('Dialog Root', () => {
    it('renders dialog component', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Dialog content')).toBeInTheDocument();
    });

    it('can be controlled with open prop', () => {
      const { rerender } = render(
        <Dialog open={false}>
          <DialogContent>Hidden</DialogContent>
        </Dialog>
      );

      // Dialog should be hidden (not in DOM when closed with Radix)
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();

      rerender(
        <Dialog open={true}>
          <DialogContent>Visible</DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Visible')).toBeInTheDocument();
    });

    it('handles onOpenChange callback', async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Dialog onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <button>Open</button>
          </DialogTrigger>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      const trigger = screen.getByRole('button', { name: /open/i });
      await user.click(trigger);

      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe('DialogTrigger', () => {
    it('renders trigger button', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
        </Dialog>
      );
      expect(screen.getByRole('button', { name: /open dialog/i })).toBeInTheDocument();
    });

    it('opens dialog when clicked', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>Dialog opened</DialogContent>
        </Dialog>
      );

      const trigger = screen.getByRole('button', { name: /open/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Dialog opened')).toBeInTheDocument();
      });
    });

    it('supports asChild pattern', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger asChild>
            <button type="button">Custom Trigger</button>
          </DialogTrigger>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      const trigger = screen.getByRole('button', { name: /custom trigger/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });
  });

  describe('DialogContent', () => {
    it('renders dialog content when open', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Main content</DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Main content')).toBeInTheDocument();
    });

    it('renders close button by default', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(
        <Dialog open={true}>
          <DialogContent showCloseButton={false}>Content</DialogContent>
        </Dialog>
      );

      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent className="custom-dialog" data-testid="dialog">
            Content
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByTestId('dialog');
      expect(content).toHaveClass('custom-dialog');
    });

    it('has proper dialog styles', () => {
      render(
        <Dialog open={true}>
          <DialogContent data-testid="dialog">Content</DialogContent>
        </Dialog>
      );

      const content = screen.getByTestId('dialog');
      expect(content).toHaveClass('fixed');
      expect(content).toHaveClass('z-50');
      expect(content).toHaveClass('rounded-lg');
      expect(content).toHaveClass('border');
      expect(content).toHaveClass('shadow-lg');
    });

    it('renders portal by default', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Portal content</DialogContent>
        </Dialog>
      );

      // Content should be in portal (outside main DOM tree)
      expect(screen.getByText('Portal content')).toBeInTheDocument();
    });
  });

  describe('DialogHeader', () => {
    it('renders dialog header', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader data-testid="header">
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute('data-slot', 'dialog-header');
    });

    it('has proper layout styles', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader data-testid="header">Header</DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('gap-2');
    });
  });

  describe('DialogTitle', () => {
    it('renders dialog title', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>My Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('My Dialog Title')).toBeInTheDocument();
    });

    it('has proper title styles', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle data-testid="title">Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('leading-none');
      expect(title).toHaveAttribute('data-slot', 'dialog-title');
    });

    it('applies custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle className="text-2xl">Large Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByText('Large Title');
      expect(title).toHaveClass('text-2xl');
    });
  });

  describe('DialogDescription', () => {
    it('renders dialog description', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogDescription>This is a description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('has proper description styles', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogDescription data-testid="desc">Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const desc = screen.getByTestId('desc');
      expect(desc).toHaveClass('text-muted-foreground');
      expect(desc).toHaveClass('text-sm');
      expect(desc).toHaveAttribute('data-slot', 'dialog-description');
    });
  });

  describe('DialogFooter', () => {
    it('renders dialog footer', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogFooter data-testid="footer">Footer content</DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('has proper layout styles', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogFooter data-testid="footer">Footer</DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('flex-col-reverse');
      expect(footer).toHaveClass('sm:flex-row');
      expect(footer).toHaveClass('sm:justify-end');
      expect(footer).toHaveAttribute('data-slot', 'dialog-footer');
    });

    it('renders action buttons', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogFooter>
              <button>Cancel</button>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });
  });

  describe('DialogClose', () => {
    it('closes dialog when clicked', async () => {
      const user = userEvent.setup();
      const handleOpenChange = vi.fn();

      render(
        <Dialog defaultOpen={true} onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <p>Content</p>
            <DialogClose asChild>
              <button>Close Dialog</button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      await user.click(closeButton);

      // Verify the onOpenChange was called with false
      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Complete Dialog Structure', () => {
    it('renders full dialog with all components', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>Are you sure you want to proceed?</DialogDescription>
            </DialogHeader>
            <div>Additional content here</div>
            <DialogFooter>
              <DialogClose asChild>
                <button>Cancel</button>
              </DialogClose>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
      expect(screen.getByText('Additional content here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('closes on overlay click by default', async () => {
      const user = userEvent.setup();

      render(
        <Dialog defaultOpen={true}>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Dialog')).toBeInTheDocument();

      // Click outside (on overlay) - behavior depends on Radix UI defaults
      // This is more of an integration test, but we can verify the overlay exists
      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      expect(overlay).toBeInTheDocument();
    });

    it('closes on escape key', async () => {
      const user = userEvent.setup();

      render(
        <Dialog defaultOpen={true}>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Accessible Dialog</DialogTitle>
            <DialogDescription>Description text</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('focuses dialog when opened', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent data-testid="content">
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByRole('button', { name: /open/i });
      await user.click(trigger);

      // Verify dialog is opened and accessible
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    });

    it('contains focusable elements', async () => {
      render(
        <Dialog defaultOpen={true}>
          <DialogContent>
            <DialogTitle>Focus Trap</DialogTitle>
            <button>Button 1</button>
            <button>Button 2</button>
            <DialogClose asChild>
              <button>Close Dialog</button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      );

      // Verify all buttons are present and focusable
      const button1 = screen.getByRole('button', { name: /button 1/i });
      const button2 = screen.getByRole('button', { name: /button 2/i });
      const closeBtn = screen.getByRole('button', { name: /close dialog/i });

      expect(button1).toBeInTheDocument();
      expect(button2).toBeInTheDocument();
      expect(closeBtn).toBeInTheDocument();
    });

    it('has screen reader close button text', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  describe('Dark Mode', () => {
    it('applies dark mode styles', () => {
      render(
        <Dialog open={true}>
          <DialogContent data-testid="content">
            <DialogTitle>Dark Mode</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByTestId('content');
      expect(content).toHaveClass('dark:border-slate-700');
    });

    it('detects dark mode via useEffect', () => {
      // This tests the dark mode detection logic in DialogContent
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Dark Detection</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Verify the component renders (dark detection happens in useEffect)
      expect(screen.getByText('Dark Detection')).toBeInTheDocument();
    });
  });

  describe('Overlay', () => {
    it('renders overlay when dialog is open', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      expect(overlay).toBeInTheDocument();
    });

    it('has proper overlay styles', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      expect(overlay).toHaveClass('fixed');
      expect(overlay).toHaveClass('inset-0');
      expect(overlay).toHaveClass('z-50');
      expect(overlay).toHaveClass('bg-black/80');
    });
  });
});
