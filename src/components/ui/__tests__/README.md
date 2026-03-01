# UI Components Tests

This directory contains comprehensive unit tests for all base UI components using React Testing Library and Vitest.

## Test Coverage

### Components Tested

- **Button** (`button.test.tsx`) - 200+ assertions
  - All variants (default, destructive, outline, secondary, ghost, link, glass, premium)
  - All sizes (default, sm, lg, xl, icon variants)
  - States (disabled, loading simulation)
  - User interactions (click, keyboard)
  - Accessibility (ARIA, focus, keyboard navigation)
  - AsChild pattern
  - Animated variant

- **Input** (`input.test.tsx`) - 150+ assertions
  - All input types (text, email, password, number, search, tel, url, date, file)
  - Value and onChange handling
  - Validation (required, pattern, min/max length)
  - States (disabled, readonly)
  - Accessibility (labels, ARIA attributes)
  - Focus handling
  - File input specific features

- **Card** (`card.test.tsx`) - 100+ assertions
  - Card structure (Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter)
  - Children rendering
  - Custom styling
  - Complete card structures
  - Accessibility

- **Badge** (`badge.test.tsx`) - 120+ assertions
  - All variants (default, secondary, destructive, outline)
  - AsChild pattern
  - Interactive badges (links, buttons)
  - Dark mode support
  - Status badges
  - Count badges
  - Accessibility (ARIA, roles)
  - Icon support

- **Dialog** (`dialog.test.tsx`) - 130+ assertions
  - Dialog structure (Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose)
  - Open/close state
  - User interactions (click, escape key, overlay)
  - Accessibility (ARIA, focus trap, keyboard navigation)
  - Dark mode detection
  - Portal rendering
  - Close button visibility

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test button.test.tsx

# Run tests with UI
npm test -- --ui
```

## Test Structure

Each test file follows this structure:

1. **Rendering** - Basic rendering and children
2. **Variants/Types** - All variants or types
3. **States** - Different component states (disabled, loading, etc.)
4. **User Interactions** - Click, keyboard, etc.
5. **Accessibility** - ARIA, roles, keyboard navigation
6. **Special Features** - Component-specific features
7. **Styling** - Custom classes, dark mode

## Testing Principles

### Accessibility First
All tests include accessibility checks:
- Proper ARIA roles and attributes
- Keyboard navigation
- Focus management
- Screen reader compatibility

### User-Centric Testing
Tests simulate real user interactions:
- Click events via `userEvent.click()`
- Keyboard navigation via `userEvent.keyboard()`
- Form input via `userEvent.type()`

### Implementation Details Avoided
Tests focus on behavior, not implementation:
- Query by role, label, text (not test IDs when possible)
- Assert on what users see/experience
- Avoid testing internal state

## Writing New Tests

### Template

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '../component-name';

describe('ComponentName', () => {
  describe('Rendering', () => {
    it('renders component', () => {
      render(<ComponentName>Content</ComponentName>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles click', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<ComponentName onClick={handleClick}>Click</ComponentName>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper role', () => {
      render(<ComponentName>Test</ComponentName>);
      expect(screen.getByRole('expected-role')).toBeInTheDocument();
    });
  });
});
```

### Best Practices

1. **Use `userEvent` over `fireEvent`**
   ```typescript
   // ✅ Good
   const user = userEvent.setup();
   await user.click(button);

   // ❌ Avoid
   fireEvent.click(button);
   ```

2. **Query by accessible attributes**
   ```typescript
   // ✅ Good
   screen.getByRole('button', { name: /submit/i })
   screen.getByLabelText('Email')

   // ❌ Avoid
   screen.getByTestId('submit-button')
   ```

3. **Wait for async updates**
   ```typescript
   // ✅ Good
   await user.click(button);
   await waitFor(() => {
     expect(screen.getByText('Updated')).toBeInTheDocument();
   });

   // ❌ Avoid
   user.click(button);
   expect(screen.getByText('Updated')).toBeInTheDocument();
   ```

4. **Test user flows, not implementation**
   ```typescript
   // ✅ Good
   it('submits form on enter key', async () => {
     const onSubmit = vi.fn();
     render(<Form onSubmit={onSubmit} />);
     await user.type(screen.getByRole('textbox'), 'Hello{Enter}');
     expect(onSubmit).toHaveBeenCalled();
   });

   // ❌ Avoid
   it('calls handleKeyPress with Enter', () => {
     // Testing implementation details
   });
   ```

## Coverage Goals

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## CI/CD Integration

Tests run automatically on:
- Pre-commit hook
- Pull request creation
- Main branch push

## Troubleshooting

### Common Issues

1. **"Cannot find module '@testing-library/user-event'"**
   ```bash
   npm install --save-dev @testing-library/user-event
   ```

2. **"ResizeObserver is not defined"**
   - Already mocked in `tests/setup.ts`

3. **"matchMedia is not a function"**
   - Already mocked in `tests/setup.ts`

4. **Framer Motion errors**
   - Already mocked in `tests/setup.ts`

## Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Vitest Docs](https://vitest.dev)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
- [Testing Accessibility](https://testing-library.com/docs/queries/about#priority)
