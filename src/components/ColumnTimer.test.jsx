import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import ColumnTimer from './ColumnTimer';

// Mock the BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

// Mock the NotificationContext
const { mockShowNotification } = vi.hoisted(() => ({
  mockShowNotification: vi.fn()
}));
vi.mock('../context/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: mockShowNotification,
    notification: { message: '', show: false }
  }),
  NotificationProvider: ({ children }) => children
}));

// Mock useOnClickOutside to avoid side effects in tests
vi.mock('../hooks/useOnClickOutside', () => ({
  useOnClickOutside: vi.fn()
}));


describe('ColumnTimer Component', () => {
  const mockStartColumnTimer = vi.fn();
  const mockPauseColumnTimer = vi.fn();
  const mockResumeColumnTimer = vi.fn();
  const mockResetColumnTimer = vi.fn();
  const mockRestartColumnTimer = vi.fn();

  const defaultMockContext = {
    startColumnTimer: mockStartColumnTimer,
    pauseColumnTimer: mockPauseColumnTimer,
    resumeColumnTimer: mockResumeColumnTimer,
    resetColumnTimer: mockResetColumnTimer,
    restartColumnTimer: mockRestartColumnTimer
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(defaultMockContext);
  });

  describe('setup mode (no timer active)', () => {
    test('renders clock icon button when no timer data', () => {
      render(<ColumnTimer columnId="col1" timerData={undefined} />);
      expect(screen.getByTitle('Set column timer')).toBeInTheDocument();
    });

    test('renders clock icon button when timerData is null', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      expect(screen.getByTitle('Set column timer')).toBeInTheDocument();
    });

    test('shows preset buttons when clock icon is clicked', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));

      expect(screen.getByText('1m')).toBeInTheDocument();
      expect(screen.getByText('3m')).toBeInTheDocument();
      expect(screen.getByText('5m')).toBeInTheDocument();
      expect(screen.getByText('10m')).toBeInTheDocument();
    });

    test('shows custom input in setup popover', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));

      expect(screen.getByLabelText('Custom timer duration in minutes')).toBeInTheDocument();
    });

    test('starts timer with preset duration when preset button is clicked', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));
      fireEvent.click(screen.getByText('5m'));

      expect(mockStartColumnTimer).toHaveBeenCalledWith('col1', 300);
    });

    test('starts timer with 1 minute preset', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));
      fireEvent.click(screen.getByText('1m'));

      expect(mockStartColumnTimer).toHaveBeenCalledWith('col1', 60);
    });

    test('starts timer with 3 minute preset', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));
      fireEvent.click(screen.getByText('3m'));

      expect(mockStartColumnTimer).toHaveBeenCalledWith('col1', 180);
    });

    test('starts timer with 10 minute preset', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));
      fireEvent.click(screen.getByText('10m'));

      expect(mockStartColumnTimer).toHaveBeenCalledWith('col1', 600);
    });

    test('starts timer with custom duration', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));

      const input = screen.getByLabelText('Custom timer duration in minutes');
      fireEvent.change(input, { target: { value: '7' } });

      const customStartBtn = document.querySelector('.column-timer-custom-start');
      fireEvent.click(customStartBtn);

      expect(mockStartColumnTimer).toHaveBeenCalledWith('col1', 420);
    });

    test('starts timer with custom duration on Enter key', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));

      const input = screen.getByLabelText('Custom timer duration in minutes');
      fireEvent.change(input, { target: { value: '2' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockStartColumnTimer).toHaveBeenCalledWith('col1', 120);
    });

    test('does not start timer with invalid custom duration (zero)', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));

      const input = screen.getByLabelText('Custom timer duration in minutes');
      fireEvent.change(input, { target: { value: '0' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockStartColumnTimer).not.toHaveBeenCalled();
    });

    test('does not start timer with negative custom duration', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));

      const input = screen.getByLabelText('Custom timer duration in minutes');
      fireEvent.change(input, { target: { value: '-5' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockStartColumnTimer).not.toHaveBeenCalled();
    });

    test('does not start timer with duration exceeding 60 minutes', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));

      const input = screen.getByLabelText('Custom timer duration in minutes');
      fireEvent.change(input, { target: { value: '61' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockStartColumnTimer).not.toHaveBeenCalled();
    });

    test('custom start button is disabled when input is empty', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));

      const customStartBtn = document.querySelector('.column-timer-custom-start');
      expect(customStartBtn).toBeDisabled();
    });

    test('closes setup popover when clock button is toggled', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));

      // Verify setup is shown
      expect(screen.getByText('1m')).toBeInTheDocument();

      // Click the clock button again to toggle closed
      fireEvent.click(screen.getByTitle('Set column timer'));

      // Setup should be hidden
      expect(screen.queryByText('1m')).not.toBeInTheDocument();
    });

    test('toggles setup popover on repeated clicks', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      const btn = screen.getByTitle('Set column timer');

      // Open
      fireEvent.click(btn);
      expect(screen.getByText('1m')).toBeInTheDocument();

      // Close
      fireEvent.click(btn);
      expect(screen.queryByText('1m')).not.toBeInTheDocument();
    });

    test('hides setup popover after starting a timer', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));
      fireEvent.click(screen.getByText('5m'));

      // After starting, the popover logic closes (setup hidden)
      // The component will re-render with timerData from parent, but in this test
      // timerData is still null so setup button shows again without popover
      expect(screen.queryByText('1m')).not.toBeInTheDocument();
    });
  });

  describe('active timer (running)', () => {
    const runningTimerData = {
      duration: 300,
      startedAt: Date.now(),
      isRunning: true,
      pausedRemaining: null,
      phase: 'CREATION'
    };

    test('renders active timer with role="timer"', () => {
      render(<ColumnTimer columnId="col1" timerData={runningTimerData} />);
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    test('renders SVG progress ring', () => {
      render(<ColumnTimer columnId="col1" timerData={runningTimerData} />);
      const svg = document.querySelector('.column-timer-svg');
      expect(svg).toBeInTheDocument();
    });

    test('renders pause button when running', () => {
      render(<ColumnTimer columnId="col1" timerData={runningTimerData} />);
      expect(screen.getByLabelText('Pause timer')).toBeInTheDocument();
    });

    test('renders restart button', () => {
      render(<ColumnTimer columnId="col1" timerData={runningTimerData} />);
      expect(screen.getByLabelText('Restart timer')).toBeInTheDocument();
    });

    test('renders stop button', () => {
      render(<ColumnTimer columnId="col1" timerData={runningTimerData} />);
      expect(screen.getByLabelText('Stop timer')).toBeInTheDocument();
    });

    test('calls pauseColumnTimer with columnId and timerData when pause is clicked', () => {
      render(<ColumnTimer columnId="col1" timerData={runningTimerData} />);
      fireEvent.click(screen.getByLabelText('Pause timer'));
      expect(mockPauseColumnTimer).toHaveBeenCalledWith('col1', runningTimerData);
    });

    test('calls restartColumnTimer with columnId and timerData when restart is clicked', () => {
      render(<ColumnTimer columnId="col1" timerData={runningTimerData} />);
      fireEvent.click(screen.getByLabelText('Restart timer'));
      expect(mockRestartColumnTimer).toHaveBeenCalledWith('col1', runningTimerData);
    });

    test('calls resetColumnTimer with columnId when stop is clicked', () => {
      render(<ColumnTimer columnId="col1" timerData={runningTimerData} />);
      fireEvent.click(screen.getByLabelText('Stop timer'));
      expect(mockResetColumnTimer).toHaveBeenCalledWith('col1');
    });

    test('does not render resume button when running', () => {
      render(<ColumnTimer columnId="col1" timerData={runningTimerData} />);
      expect(screen.queryByLabelText('Resume timer')).not.toBeInTheDocument();
    });

    test('does not render setup clock icon when timer is active', () => {
      render(<ColumnTimer columnId="col1" timerData={runningTimerData} />);
      expect(screen.queryByTitle('Set column timer')).not.toBeInTheDocument();
    });
  });

  describe('paused timer', () => {
    const pausedTimerData = {
      duration: 300,
      startedAt: null,
      isRunning: false,
      pausedRemaining: 180,
      phase: 'CREATION'
    };

    test('renders resume button when paused', () => {
      render(<ColumnTimer columnId="col1" timerData={pausedTimerData} />);
      expect(screen.getByLabelText('Resume timer')).toBeInTheDocument();
    });

    test('does not render pause button when paused', () => {
      render(<ColumnTimer columnId="col1" timerData={pausedTimerData} />);
      expect(screen.queryByLabelText('Pause timer')).not.toBeInTheDocument();
    });

    test('calls resumeColumnTimer with columnId and timerData when resume is clicked', () => {
      render(<ColumnTimer columnId="col1" timerData={pausedTimerData} />);
      fireEvent.click(screen.getByLabelText('Resume timer'));
      expect(mockResumeColumnTimer).toHaveBeenCalledWith('col1', pausedTimerData);
    });

    test('displays paused time correctly', () => {
      render(<ColumnTimer columnId="col1" timerData={pausedTimerData} />);
      // 180 seconds = 3:00
      expect(screen.getByText('3:00')).toBeInTheDocument();
    });

    test('still renders restart and stop buttons when paused', () => {
      render(<ColumnTimer columnId="col1" timerData={pausedTimerData} />);
      expect(screen.getByLabelText('Restart timer')).toBeInTheDocument();
      expect(screen.getByLabelText('Stop timer')).toBeInTheDocument();
    });
  });

  describe('urgency states', () => {
    test('applies normal class when more than 50% time remaining', () => {
      render(
        <ColumnTimer
          columnId="col1"
          timerData={{
            duration: 300,
            startedAt: Date.now(),
            isRunning: true,
            pausedRemaining: null,
            phase: 'CREATION'
          }}
        />
      );
      const timer = screen.getByRole('timer');
      expect(timer.classList.contains('normal')).toBe(true);
    });

    test('applies warning class when 20-50% time remaining', () => {
      render(
        <ColumnTimer
          columnId="col1"
          timerData={{
            duration: 300,
            startedAt: Date.now() - 210 * 1000, // 210s ago, 90 remaining (30%)
            isRunning: true,
            pausedRemaining: null,
            phase: 'CREATION'
          }}
        />
      );
      const timer = screen.getByRole('timer');
      expect(timer.classList.contains('warning')).toBe(true);
    });

    test('applies critical class when less than 20% time remaining', () => {
      render(
        <ColumnTimer
          columnId="col1"
          timerData={{
            duration: 300,
            startedAt: Date.now() - 270 * 1000, // 270s ago, 30 remaining (10%)
            isRunning: true,
            pausedRemaining: null,
            phase: 'CREATION'
          }}
        />
      );
      const timer = screen.getByRole('timer');
      expect(timer.classList.contains('critical')).toBe(true);
    });

    test('applies expired class when timer has expired', () => {
      render(
        <ColumnTimer
          columnId="col1"
          timerData={{
            duration: 300,
            startedAt: Date.now() - 400 * 1000, // well past duration
            isRunning: true,
            pausedRemaining: null,
            phase: 'CREATION'
          }}
        />
      );
      const timer = screen.getByRole('timer');
      expect(timer.classList.contains('expired')).toBe(true);
    });
  });

  describe('different column IDs', () => {
    test('passes correct columnId for col-a', () => {
      render(<ColumnTimer columnId="a_abc123" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));
      fireEvent.click(screen.getByText('5m'));

      expect(mockStartColumnTimer).toHaveBeenCalledWith('a_abc123', 300);
    });

    test('passes correct columnId for col-b', () => {
      render(<ColumnTimer columnId="b_def456" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));
      fireEvent.click(screen.getByText('3m'));

      expect(mockStartColumnTimer).toHaveBeenCalledWith('b_def456', 180);
    });
  });

  describe('accessibility', () => {
    test('active timer element has role="timer"', () => {
      render(
        <ColumnTimer
          columnId="col1"
          timerData={{
            duration: 300,
            startedAt: Date.now(),
            isRunning: true,
            pausedRemaining: null,
            phase: 'CREATION'
          }}
        />
      );
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    test('timer has aria-live="polite"', () => {
      render(
        <ColumnTimer
          columnId="col1"
          timerData={{
            duration: 300,
            startedAt: Date.now(),
            isRunning: true,
            pausedRemaining: null,
            phase: 'CREATION'
          }}
        />
      );
      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute('aria-live', 'polite');
    });

    test('SVG is hidden from assistive technology', () => {
      render(
        <ColumnTimer
          columnId="col1"
          timerData={{
            duration: 300,
            startedAt: Date.now(),
            isRunning: true,
            pausedRemaining: null,
            phase: 'CREATION'
          }}
        />
      );
      const svg = document.querySelector('.column-timer-svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    test('custom input has aria-label', () => {
      render(<ColumnTimer columnId="col1" timerData={null} />);
      fireEvent.click(screen.getByTitle('Set column timer'));
      expect(screen.getByLabelText('Custom timer duration in minutes')).toBeInTheDocument();
    });

    test('all control buttons have aria-labels', () => {
      render(
        <ColumnTimer
          columnId="col1"
          timerData={{
            duration: 300,
            startedAt: Date.now(),
            isRunning: true,
            pausedRemaining: null,
            phase: 'CREATION'
          }}
        />
      );
      expect(screen.getByLabelText('Pause timer')).toBeInTheDocument();
      expect(screen.getByLabelText('Restart timer')).toBeInTheDocument();
      expect(screen.getByLabelText('Stop timer')).toBeInTheDocument();
    });

    test('timer has aria-label with remaining time', () => {
      render(
        <ColumnTimer
          columnId="col1"
          timerData={{
            duration: 300,
            startedAt: null,
            isRunning: false,
            pausedRemaining: 125,
            phase: 'CREATION'
          }}
        />
      );
      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute('aria-label', '2:05 remaining');
    });
  });

  describe('formatTime display (indirect)', () => {
    test('formats various durations correctly via paused timer display', () => {
      const testCases = [
        { pausedRemaining: 0, expected: '0:00' },
        { pausedRemaining: 59, expected: '0:59' },
        { pausedRemaining: 60, expected: '1:00' },
        { pausedRemaining: 125, expected: '2:05' },
        { pausedRemaining: 600, expected: '10:00' }
      ];

      testCases.forEach(({ pausedRemaining, expected }) => {
        const { unmount } = render(
          <ColumnTimer
            columnId="col1"
            timerData={{
              duration: 600,
              startedAt: null,
              isRunning: false,
              pausedRemaining,
              phase: 'CREATION'
            }}
          />
        );
        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
