import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

// Helper component that throws on render based on shouldThrow prop
function ThrowingComponent({ shouldThrow = false, children = null }) {
  if (shouldThrow) {
    throw new Error('Test error from child component');
  }
  return <div>{children}</div>;
}

// Helper component that can toggle error state
let toggleErrorState = false;
function TogglingErrorComponent() {
  if (toggleErrorState) {
    throw new Error('Toggled error');
  }
  return <div>Success content</div>;
}

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    // Mock console.error to suppress error output during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock window.location.reload
    delete window.location;
    window.location = { reload: vi.fn() };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Hello World</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders error fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(
        'An unexpected error occurred. You can try again or reload the page.'
      )
    ).toBeInTheDocument();
  });

  it('shows error message in details/summary', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const summary = screen.getByText('Error details');
    expect(summary).toBeInTheDocument();

    const detailsElement = summary.closest('details');
    expect(detailsElement).toBeInTheDocument();
    expect(detailsElement).toHaveTextContent('Test error from child component');
  });

  it('"Try again" button resets boundary state and allows successful re-render', () => {
    // Start with error state
    toggleErrorState = true;
    render(
      <ErrorBoundary>
        <TogglingErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Reset error condition before trying again
    toggleErrorState = false;

    // Click "Try again" button to reset the error state
    const tryAgainButton = screen.getByRole('button', { name: 'Try again' });
    fireEvent.click(tryAgainButton);

    // After click with error cleared, should render children successfully
    expect(screen.getByText('Success content')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('"Reload page" button calls window.location.reload', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: 'Reload page' });
    fireEvent.click(reloadButton);

    expect(window.location.reload).toHaveBeenCalled();
  });

  it('logs error to console.error via componentDidCatch', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('renders warning icon in error fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('renders both action buttons in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reload page' })
    ).toBeInTheDocument();
  });
});
