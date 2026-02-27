import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import Timer from './Timer';

// Mock the BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

describe('Timer Component', () => {
  const mockStartTimer = vi.fn();
  const mockPauseTimer = vi.fn();
  const mockResumeTimer = vi.fn();
  const mockResetTimer = vi.fn();
  const mockRestartTimer = vi.fn();
  const mockShowNotification = vi.fn();

  const defaultMockContext = {
    timerData: null,
    startTimer: mockStartTimer,
    pauseTimer: mockPauseTimer,
    resumeTimer: mockResumeTimer,
    restartTimer: mockRestartTimer,
    resetTimer: mockResetTimer,
    isOwner: false // kept for backward compatibility in mock but no longer used for access control
  };
  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(defaultMockContext);
  });

  describe('when no timer is active', () => {
    test('renders Set Timer button for any user', () => {
      render(<Timer showNotification={mockShowNotification} />);
      expect(screen.getByTitle('Set timer')).toBeInTheDocument();
    });
  });

  describe('when user is owner and no timer is active', () => {
    beforeEach(() => {
      useBoardContext.mockReturnValue({
        ...defaultMockContext
      });
    });

    test('renders Set Timer button', () => {
      render(<Timer showNotification={mockShowNotification} />);
      expect(screen.getByTitle('Set timer')).toBeInTheDocument();
    });

    test('shows timer setup when Set Timer is clicked', () => {
      render(<Timer showNotification={mockShowNotification} />);
      fireEvent.click(screen.getByTitle('Set timer'));

      expect(screen.getByText('1m')).toBeInTheDocument();
      expect(screen.getByText('3m')).toBeInTheDocument();
      expect(screen.getByText('5m')).toBeInTheDocument();
      expect(screen.getByText('10m')).toBeInTheDocument();
    });

    test('shows custom input in setup', () => {
      render(<Timer showNotification={mockShowNotification} />);
      fireEvent.click(screen.getByTitle('Set timer'));

      expect(screen.getByLabelText('Custom timer duration in minutes')).toBeInTheDocument();
    });

    test('starts timer with preset duration when preset button is clicked', () => {
      render(<Timer showNotification={mockShowNotification} />);
      fireEvent.click(screen.getByTitle('Set timer'));
      fireEvent.click(screen.getByText('5m'));

      expect(mockStartTimer).toHaveBeenCalledWith(300);
    });

    test('starts timer with 1 minute preset', () => {
      render(<Timer showNotification={mockShowNotification} />);
      fireEvent.click(screen.getByTitle('Set timer'));
      fireEvent.click(screen.getByText('1m'));

      expect(mockStartTimer).toHaveBeenCalledWith(60);
    });

    test('starts timer with custom duration', () => {
      render(<Timer showNotification={mockShowNotification} />);
      fireEvent.click(screen.getByTitle('Set timer'));

      const input = screen.getByLabelText('Custom timer duration in minutes');
      fireEvent.change(input, { target: { value: '7' } });

      // Find the start button (Play icon button in custom section)
      const customStartButtons = screen.getAllByRole('button');
      // The custom start button has the primary-btn class
      const startBtn = customStartButtons.find(btn => btn.classList.contains('timer-custom-start'));
      fireEvent.click(startBtn);

      expect(mockStartTimer).toHaveBeenCalledWith(420);
    });

    test('starts timer with custom duration on Enter key', () => {
      render(<Timer showNotification={mockShowNotification} />);
      fireEvent.click(screen.getByTitle('Set timer'));

      const input = screen.getByLabelText('Custom timer duration in minutes');
      fireEvent.change(input, { target: { value: '2' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockStartTimer).toHaveBeenCalledWith(120);
    });

    test('does not start timer with invalid custom duration', () => {
      render(<Timer showNotification={mockShowNotification} />);
      fireEvent.click(screen.getByTitle('Set timer'));

      const input = screen.getByLabelText('Custom timer duration in minutes');
      fireEvent.change(input, { target: { value: '0' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockStartTimer).not.toHaveBeenCalled();
    });

    test('closes setup when cancel button is clicked', () => {
      render(<Timer showNotification={mockShowNotification} />);
      fireEvent.click(screen.getByTitle('Set timer'));

      // Verify setup is shown
      expect(screen.getByText('1m')).toBeInTheDocument();

      // Click the cancel button
      fireEvent.click(screen.getByTitle('Cancel'));

      // Setup should be hidden, back to Set Timer button
      expect(screen.getByTitle('Set timer')).toBeInTheDocument();
      expect(screen.queryByText('1m')).not.toBeInTheDocument();
    });
  });

  describe('when timer is running (owner view)', () => {
    beforeEach(() => {
      useBoardContext.mockReturnValue({
        ...defaultMockContext,
        timerData: {
          duration: 300,
          startedAt: Date.now(),
          isRunning: true,
          pausedRemaining: null,
          phase: 'CREATION'
        }
      });
    });

    test('renders active timer with time display', () => {
      render(<Timer showNotification={mockShowNotification} />);
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    test('renders SVG progress ring', () => {
      render(<Timer showNotification={mockShowNotification} />);
      const svg = document.querySelector('.timer-svg');
      expect(svg).toBeInTheDocument();
    });

    test('renders pause button for owner', () => {
      render(<Timer showNotification={mockShowNotification} />);
      expect(screen.getByLabelText('Pause timer')).toBeInTheDocument();
    });

    test('renders restart button for owner', () => {
      render(<Timer showNotification={mockShowNotification} />);
      expect(screen.getByLabelText('Restart timer')).toBeInTheDocument();
    });

    test('renders stop button for owner', () => {
      render(<Timer showNotification={mockShowNotification} />);
      expect(screen.getByLabelText('Stop timer')).toBeInTheDocument();
    });

    test('calls pauseTimer when pause button is clicked', () => {
      render(<Timer showNotification={mockShowNotification} />);
      fireEvent.click(screen.getByLabelText('Pause timer'));
      expect(mockPauseTimer).toHaveBeenCalled();
    });

    test('calls restartTimer when restart button is clicked', () => {
      render(<Timer showNotification={mockShowNotification} />);
      fireEvent.click(screen.getByLabelText('Restart timer'));
      expect(mockRestartTimer).toHaveBeenCalled();
    });

    test('calls resetTimer when stop button is clicked', () => {
      render(<Timer showNotification={mockShowNotification} />);
      fireEvent.click(screen.getByLabelText('Stop timer'));
      expect(mockResetTimer).toHaveBeenCalled();
    });
  });

  describe('when timer is paused (owner view)', () => {
    beforeEach(() => {
      useBoardContext.mockReturnValue({
        ...defaultMockContext,
        timerData: {
          duration: 300,
          startedAt: null,
          isRunning: false,
          pausedRemaining: 180,
          phase: 'CREATION'
        }
      });
    });

    test('renders resume button', () => {
      render(<Timer showNotification={mockShowNotification} />);
      expect(screen.getByLabelText('Resume timer')).toBeInTheDocument();
    });

    test('calls resumeTimer when resume button is clicked', () => {
      render(<Timer showNotification={mockShowNotification} />);
      fireEvent.click(screen.getByLabelText('Resume timer'));
      expect(mockResumeTimer).toHaveBeenCalled();
    });

    test('displays paused time', () => {
      render(<Timer showNotification={mockShowNotification} />);
      // 180 seconds = 3:00
      expect(screen.getByText('3:00')).toBeInTheDocument();
    });
  });

  describe('when timer is running (non-owner view)', () => {
    beforeEach(() => {
      useBoardContext.mockReturnValue({
        ...defaultMockContext,
        isOwner: false,
        timerData: {
          duration: 300,
          startedAt: Date.now(),
          isRunning: true,
          pausedRemaining: null,
          phase: 'CREATION'
        }
      });
    });

    test('renders active timer display', () => {
      render(<Timer showNotification={mockShowNotification} />);
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    test('renders control buttons for all users', () => {
      render(<Timer showNotification={mockShowNotification} />);
      expect(screen.getByLabelText('Pause timer')).toBeInTheDocument();
      expect(screen.getByLabelText('Restart timer')).toBeInTheDocument();
      expect(screen.getByLabelText('Stop timer')).toBeInTheDocument();
    });
  });

  describe('urgency states', () => {
    test('applies normal class when more than 50% time remaining', () => {
      useBoardContext.mockReturnValue({
        ...defaultMockContext,
        isOwner: false,
        timerData: {
          duration: 300,
          startedAt: Date.now(),
          isRunning: true,
          pausedRemaining: null,
          phase: 'CREATION'
        }
      });

      render(<Timer showNotification={mockShowNotification} />);
      const timer = screen.getByRole('timer');
      expect(timer.classList.contains('normal')).toBe(true);
    });

    test('applies warning class when 20-50% time remaining', () => {
      useBoardContext.mockReturnValue({
        ...defaultMockContext,
        isOwner: false,
        timerData: {
          duration: 300,
          startedAt: Date.now() - 210 * 1000, // 210 seconds ago, 90 remaining (30%)
          isRunning: true,
          pausedRemaining: null,
          phase: 'CREATION'
        }
      });

      render(<Timer showNotification={mockShowNotification} />);
      const timer = screen.getByRole('timer');
      expect(timer.classList.contains('warning')).toBe(true);
    });

    test('applies critical class when less than 20% time remaining', () => {
      useBoardContext.mockReturnValue({
        ...defaultMockContext,
        isOwner: false,
        timerData: {
          duration: 300,
          startedAt: Date.now() - 270 * 1000, // 270 seconds ago, 30 remaining (10%)
          isRunning: true,
          pausedRemaining: null,
          phase: 'CREATION'
        }
      });

      render(<Timer showNotification={mockShowNotification} />);
      const timer = screen.getByRole('timer');
      expect(timer.classList.contains('critical')).toBe(true);
    });
  });

  describe('accessibility', () => {
    test('timer element has role="timer"', () => {
      useBoardContext.mockReturnValue({
        ...defaultMockContext,
        isOwner: false,
        timerData: {
          duration: 300,
          startedAt: Date.now(),
          isRunning: true,
          pausedRemaining: null,
          phase: 'CREATION'
        }
      });

      render(<Timer showNotification={mockShowNotification} />);
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    test('timer has aria-live="polite"', () => {
      useBoardContext.mockReturnValue({
        ...defaultMockContext,
        isOwner: false,
        timerData: {
          duration: 300,
          startedAt: Date.now(),
          isRunning: true,
          pausedRemaining: null,
          phase: 'CREATION'
        }
      });

      render(<Timer showNotification={mockShowNotification} />);
      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute('aria-live', 'polite');
    });

    test('SVG is hidden from assistive technology', () => {
      useBoardContext.mockReturnValue({
        ...defaultMockContext,
        isOwner: false,
        timerData: {
          duration: 300,
          startedAt: Date.now(),
          isRunning: true,
          pausedRemaining: null,
          phase: 'CREATION'
        }
      });

      render(<Timer showNotification={mockShowNotification} />);
      const svg = document.querySelector('.timer-svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    test('custom input has aria-label', () => {
      useBoardContext.mockReturnValue({
        ...defaultMockContext
      });
      render(<Timer showNotification={mockShowNotification} />);
      fireEvent.click(screen.getByTitle('Set timer'));
      expect(screen.getByLabelText('Custom timer duration in minutes')).toBeInTheDocument();
    });
  });

  describe('formatTime helper', () => {
    test('formats various durations correctly', () => {
      // We test formatTime indirectly via the paused timer display
      const testCases = [
        { pausedRemaining: 0, expected: '0:00' },
        { pausedRemaining: 59, expected: '0:59' },
        { pausedRemaining: 60, expected: '1:00' },
        { pausedRemaining: 125, expected: '2:05' },
        { pausedRemaining: 600, expected: '10:00' },
      ];

      testCases.forEach(({ pausedRemaining, expected }) => {
        useBoardContext.mockReturnValue({
          ...defaultMockContext,
          isOwner: false,
          timerData: {
            duration: 600,
            startedAt: null,
            isRunning: false,
            pausedRemaining,
            phase: 'CREATION'
          }
        });

        const { unmount } = render(<Timer showNotification={mockShowNotification} />);
        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
