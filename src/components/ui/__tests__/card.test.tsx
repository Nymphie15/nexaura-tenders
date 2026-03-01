import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '../card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders card element', () => {
      render(<Card data-testid="card">Card content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('data-slot', 'card');
    });

    it('renders children correctly', () => {
      render(
        <Card>
          <div>Child 1</div>
          <div>Child 2</div>
        </Card>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Card className="custom-card" data-testid="card">Card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-card');
    });

    it('has default card styles', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('text-card-foreground');
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('shadow-sm');
    });

    it('uses div element', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content').parentElement;
      expect(card?.tagName).toBe('DIV');
    });
  });

  describe('CardHeader', () => {
    it('renders card header', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute('data-slot', 'card-header');
    });

    it('has proper grid layout classes', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('grid');
      expect(header).toHaveClass('grid-rows-[auto_auto]');
    });

    it('renders children', () => {
      render(
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('renders card title', () => {
      render(<CardTitle>My Card Title</CardTitle>);
      expect(screen.getByText('My Card Title')).toBeInTheDocument();
    });

    it('has proper title styles', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('leading-none');
      expect(title).toHaveAttribute('data-slot', 'card-title');
    });

    it('applies custom className', () => {
      render(<CardTitle className="text-2xl" data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-2xl');
    });

    it('renders different content types', () => {
      const { rerender } = render(<CardTitle>Text title</CardTitle>);
      expect(screen.getByText('Text title')).toBeInTheDocument();

      rerender(
        <CardTitle>
          <span>Complex</span> <strong>Title</strong>
        </CardTitle>
      );
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
    });
  });

  describe('CardDescription', () => {
    it('renders card description', () => {
      render(<CardDescription>This is a description</CardDescription>);
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('has proper description styles', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      const desc = screen.getByTestId('desc');
      expect(desc).toHaveClass('text-muted-foreground');
      expect(desc).toHaveClass('text-sm');
      expect(desc).toHaveAttribute('data-slot', 'card-description');
    });

    it('applies custom className', () => {
      render(<CardDescription className="italic" data-testid="desc">Desc</CardDescription>);
      const desc = screen.getByTestId('desc');
      expect(desc).toHaveClass('italic');
    });
  });

  describe('CardAction', () => {
    it('renders card action', () => {
      render(<CardAction data-testid="action">Action Button</CardAction>);
      expect(screen.getByTestId('action')).toBeInTheDocument();
    });

    it('has proper positioning classes', () => {
      render(<CardAction data-testid="action">Action</CardAction>);
      const action = screen.getByTestId('action');
      expect(action).toHaveClass('col-start-2');
      expect(action).toHaveClass('row-span-2');
      expect(action).toHaveClass('row-start-1');
      expect(action).toHaveClass('self-start');
      expect(action).toHaveClass('justify-self-end');
      expect(action).toHaveAttribute('data-slot', 'card-action');
    });

    it('renders button or any component', () => {
      render(
        <CardAction>
          <button>Edit</button>
        </CardAction>
      );
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });
  });

  describe('CardContent', () => {
    it('renders card content', () => {
      render(<CardContent>Main content here</CardContent>);
      expect(screen.getByText('Main content here')).toBeInTheDocument();
    });

    it('has proper padding', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('px-6');
      expect(content).toHaveAttribute('data-slot', 'card-content');
    });

    it('applies custom className', () => {
      render(<CardContent className="py-8" data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('py-8');
    });

    it('renders complex content', () => {
      render(
        <CardContent>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </CardContent>
      );
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('CardFooter', () => {
    it('renders card footer', () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('has proper flex layout', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
      expect(footer).toHaveClass('px-6');
      expect(footer).toHaveAttribute('data-slot', 'card-footer');
    });

    it('renders action buttons', () => {
      render(
        <CardFooter>
          <button>Cancel</button>
          <button>Save</button>
        </CardFooter>
      );
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });

  describe('Complete Card Structure', () => {
    it('renders full card with all components', () => {
      render(
        <Card data-testid="card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
            <CardAction>
              <button>Action</button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p>Main content of the card</p>
          </CardContent>
          <CardFooter>
            <button>Cancel</button>
            <button>Confirm</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card description text')).toBeInTheDocument();
      expect(screen.getByText('Main content of the card')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    it('renders minimal card', () => {
      render(
        <Card>
          <CardContent>Simple card</CardContent>
        </Card>
      );
      expect(screen.getByText('Simple card')).toBeInTheDocument();
    });

    it('renders card without footer', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title Only</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      expect(screen.getByText('Title Only')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('can have aria-label on Card', () => {
      render(<Card aria-label="Product card">Content</Card>);
      const card = screen.getByLabelText('Product card');
      expect(card).toBeInTheDocument();
    });

    it('supports semantic HTML with proper nesting', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Accessible content</p>
          </CardContent>
        </Card>
      );

      const title = screen.getByText('Accessible Card');
      const content = screen.getByText('Accessible content');

      expect(title).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });
  });

  describe('Styling Variants', () => {
    it('applies border styling', () => {
      render(<Card className="border-red-500" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-red-500');
    });

    it('applies shadow variants', () => {
      render(<Card className="shadow-lg" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('shadow-lg');
    });

    it('applies background variants', () => {
      render(<Card className="bg-slate-100" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-slate-100');
    });
  });
});
