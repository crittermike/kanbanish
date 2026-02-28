import { Component } from 'react';

/**
 * React error boundary that catches render errors in the subtree.
 *
 * Displays a friendly fallback UI instead of a blank white screen.
 * Users can click "Try again" to reset the boundary and re-render.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-message">
              An unexpected error occurred. You can try again or reload the page.
            </p>
            {this.state.error && (
              <details className="error-boundary-details">
                <summary>Error details</summary>
                <pre>{this.state.error.message || String(this.state.error)}</pre>
              </details>
            )}
            <div className="error-boundary-actions">
              <button
                className="error-boundary-btn error-boundary-btn-primary"
                onClick={this.handleReset}
              >
                Try again
              </button>
              <button
                className="error-boundary-btn error-boundary-btn-secondary"
                onClick={this.handleReload}
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
