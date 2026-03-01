import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('data-slot', 'input');
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter your name" />);
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Input className="custom-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input');
    });

    it('renders with default styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('bg-background');
      expect(input).toHaveClass('border-input');
      expect(input).toHaveClass('rounded-md');
    });
  });

  describe('Input Types', () => {
    it('renders text input by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      // Text is default for textbox role, type attribute may not be explicitly set
      expect(input).toBeInTheDocument();
    });

    it('renders email input', () => {
      render(<Input type="email" />);
      const input = document.querySelector('input[type="email"]');
      expect(input).toBeInTheDocument();
    });

    it('renders password input', () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('renders number input', () => {
      render(<Input type="number" />);
      const input = document.querySelector('input[type="number"]');
      expect(input).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(<Input type="search" />);
      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });

    it('renders tel input', () => {
      render(<Input type="tel" />);
      const input = document.querySelector('input[type="tel"]');
      expect(input).toBeInTheDocument();
    });

    it('renders url input', () => {
      render(<Input type="url" />);
      const input = document.querySelector('input[type="url"]');
      expect(input).toBeInTheDocument();
    });

    it('renders date input', () => {
      render(<Input type="date" />);
      const input = document.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });

    it('renders file input', () => {
      render(<Input type="file" />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Value and onChange', () => {
    it('renders with initial value', () => {
      render(<Input value="Initial Value" onChange={vi.fn()} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Initial Value');
    });

    it('calls onChange when value changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'Hello');

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(5); // Once per character
    });

    it('updates value on user input', async () => {
      const user = userEvent.setup();
      render(<Input defaultValue="" />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'New text');

      expect(input.value).toBe('New text');
    });

    it('handles controlled input', async () => {
      const ControlledInput = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid="controlled"
          />
        );
      };

      const user = userEvent.setup();
      render(<ControlledInput />);

      const input = screen.getByTestId('controlled') as HTMLInputElement;
      await user.type(input, 'Controlled');

      expect(input.value).toBe('Controlled');
    });
  });

  describe('Validation', () => {
    it('renders with required attribute', () => {
      render(<Input required />);
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    it('renders with pattern attribute', () => {
      render(<Input pattern="[0-9]*" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('pattern', '[0-9]*');
    });

    it('renders with minLength and maxLength', () => {
      render(<Input minLength={5} maxLength={10} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('minLength', '5');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('supports aria-invalid state', () => {
      render(<Input aria-invalid="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveClass('aria-invalid:border-destructive');
    });

    it('renders with min and max for number input', () => {
      render(<Input type="number" min={0} max={100} />);
      const input = document.querySelector('input[type="number"]');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });
  });

  describe('States', () => {
    it('renders disabled state', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:pointer-events-none');
      expect(input).toHaveClass('disabled:opacity-50');
    });

    it('does not allow input when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'Test');

      expect(input.value).toBe('');
    });

    it('renders readonly state', () => {
      render(<Input readOnly value="Read only" onChange={vi.fn()} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readOnly');
    });

    it('does not allow changes when readonly', async () => {
      const user = userEvent.setup();
      render(<Input readOnly defaultValue="Read only" />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      const initialValue = input.value;

      await user.type(input, 'Try to change');

      expect(input.value).toBe(initialValue);
    });
  });

  describe('Accessibility', () => {
    it('has proper textbox role by default', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Input aria-label="Username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="error-message" />
          <div id="error-message">This field is required</div>
        </>
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'error-message');
    });

    it('works with label element', () => {
      render(
        <>
          <label htmlFor="test-input">Name</label>
          <Input id="test-input" />
        </>
      );
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });

    it('has focus-visible styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus-visible:border-ring');
      expect(input).toHaveClass('focus-visible:ring-ring/50');
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Input />);

      await user.tab();

      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });
  });

  describe('Focus Handling', () => {
    it('can be focused programmatically', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      ref.current?.focus();

      expect(ref.current).toHaveFocus();
    });

    it('handles blur event', async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();

      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.tab(); // Move focus away

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('handles focus event', async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();

      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');

      await user.click(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Special Features', () => {
    it('handles autocomplete attribute', () => {
      render(<Input autoComplete="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autoComplete', 'email');
    });

    it('handles name attribute', () => {
      render(<Input name="username" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'username');
    });

    it('handles id attribute', () => {
      render(<Input id="my-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'my-input');
    });

    it('supports defaultValue', () => {
      render(<Input defaultValue="Default text" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Default text');
    });
  });

  describe('File Input Specific', () => {
    it('renders file input with proper styles', () => {
      render(<Input type="file" />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('file:border-0');
      expect(input).toHaveClass('file:bg-transparent');
    });

    it('handles multiple files', () => {
      render(<Input type="file" multiple />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('multiple');
    });

    it('handles accept attribute', () => {
      render(<Input type="file" accept="image/*" />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('accept', 'image/*');
    });
  });

  describe('Dark Mode Styles', () => {
    it('has dark mode classes', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('dark:bg-input/30');
      expect(input).toHaveClass('dark:aria-invalid:ring-destructive/40');
    });
  });

  describe('Selection Styles', () => {
    it('has text selection styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('selection:bg-primary');
      expect(input).toHaveClass('selection:text-primary-foreground');
    });
  });
});

// Needed for controlled input test
import * as React from 'react';
