/**
 * Example Test File
 * Demonstrates how to use the test utilities
 *
 * This file can be deleted once real tests are written
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
  render,
  renderWithProviders,
  createTestQueryClient,
  mockFetchResponse,
  mockLocalStorage,
  testDataFactories,
  mockApiHandlers,
  setupMockFetch,
  userEvent,
} from '../../utils';

// Example: Simple component test
describe('Example Component Tests', () => {
  it('should render a simple component', () => {
    const TestComponent = () => <div>Hello World</div>;

    render(<TestComponent />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});

// Example: Component with providers
describe('Example with Providers', () => {
  it('should render with QueryClient provider', () => {
    const queryClient = createTestQueryClient();

    const TestComponent = () => <div>With Provider</div>;

    renderWithProviders(<TestComponent />, { queryClient });

    expect(screen.getByText('With Provider')).toBeInTheDocument();
  });
});

// Example: Testing with fetch mocks
describe('Example API Tests', () => {
  beforeEach(() => {
    setupMockFetch();
  });

  it('should mock fetch responses', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(() => mockApiHandlers.getTenders());

    const response = await fetch('/api/v1/tenders');
    const data = await response.json();

    expect(data).toBeDefined();
    expect(data.data).toBeInstanceOf(Array);
  });
});

// Example: Testing with localStorage
describe('Example localStorage Tests', () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  it('should mock localStorage', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');

    localStorage.removeItem('test');
    expect(localStorage.getItem('test')).toBeNull();
  });
});

// Example: Testing with user events
describe('Example User Interaction Tests', () => {
  it('should handle user clicks', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    const TestComponent = () => (
      <button onClick={handleClick}>Click Me</button>
    );

    render(<TestComponent />);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle user typing', async () => {
    const user = userEvent.setup();

    const TestComponent = () => <input placeholder="Type here" />;

    render(<TestComponent />);

    const input = screen.getByPlaceholderText(/type here/i);
    await user.type(input, 'Hello');

    expect(input).toHaveValue('Hello');
  });
});

// Example: Testing with mock data factories
describe('Example Mock Data Tests', () => {
  it('should use test data factories', () => {
    const user = testDataFactories.user({ email: 'custom@test.com' });

    expect(user.email).toBe('custom@test.com');
    expect(user.id).toBe('1');
    expect(user.name).toBe('Test User');
  });

  it('should create tender data', () => {
    const tender = testDataFactories.tender({
      title: 'Custom Tender',
      reference: 'CUSTOM-001',
    });

    expect(tender.title).toBe('Custom Tender');
    expect(tender.reference).toBe('CUSTOM-001');
  });
});

// Example: Async tests with waitFor
describe('Example Async Tests', () => {
  it('should wait for async updates', async () => {
    const TestComponent = () => {
      const [text, setText] = React.useState('Loading...');

      React.useEffect(() => {
        setTimeout(() => setText('Loaded!'), 100);
      }, []);

      return <div>{text}</div>;
    };

    render(<TestComponent />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Loaded!')).toBeInTheDocument();
    });
  });
});

// Example: Testing error states
describe('Example Error Handling Tests', () => {
  it('should display error messages', () => {
    const TestComponent = ({ error }: { error?: string }) => (
      <div>
        {error && <div role="alert">{error}</div>}
      </div>
    );

    const { rerender } = render(<TestComponent />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(<TestComponent error="Something went wrong" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });
});

// Add React import for JSX
import React from 'react';
