import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import OfflineIndicator from './OfflineIndicator';

// Mock the useConnectionStatus hook
vi.mock('../hooks/useConnectionStatus', () => ({
  useConnectionStatus: vi.fn()
}));

describe('OfflineIndicator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null (renders nothing) when isOnline is true', () => {
    useConnectionStatus.mockReturnValue({
      isOnline: true
    });

    const { container } = render(<OfflineIndicator />);

    expect(container.firstChild).toBeNull();
  });

  it('renders the offline banner when isOnline is false', () => {
    useConnectionStatus.mockReturnValue({
      isOnline: false
    });

    render(<OfflineIndicator />);

    const offlineBanner = screen.getByRole('alert');
    expect(offlineBanner).toBeInTheDocument();
  });

  it('banner contains the WifiOff icon area and the offline message text', () => {
    useConnectionStatus.mockReturnValue({
      isOnline: false
    });

    render(<OfflineIndicator />);

    // Check for the message text (using HTML entity conversion)
    const messageText = screen.getByText((content, element) => {
      return element && element.tagName.toLowerCase() === 'span' && content.includes('offline');
    });
    expect(messageText).toBeInTheDocument();
    expect(messageText.textContent).toContain('sync');

    // The WifiOff icon is rendered as an SVG within the banner
    const banner = screen.getByRole('alert');
    const svg = banner.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('banner has role="alert" and aria-live="polite" attributes', () => {
    useConnectionStatus.mockReturnValue({
      isOnline: false
    });

    render(<OfflineIndicator />);

    const banner = screen.getByRole('alert');
    expect(banner).toHaveAttribute('aria-live', 'polite');
  });

  it('has className "offline-indicator"', () => {
    useConnectionStatus.mockReturnValue({
      isOnline: false
    });

    render(<OfflineIndicator />);

    const banner = screen.getByRole('alert');
    expect(banner).toHaveClass('offline-indicator');
  });
});
