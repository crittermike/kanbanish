import { renderHook, act } from '@testing-library/react';
import { set, remove } from 'firebase/database';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTimer } from './useTimer';

// Mock Firebase
vi.mock('../utils/firebase', () => ({
  database: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve())
}));

const createMockProps = (overrides = {}) => ({
  boardId: 'board-123',
  user: { uid: 'user1' },
  timerData: null,
  setTimerData: vi.fn(),
  workflowPhase: 'CREATION',
  ...overrides
});

describe('useTimer', () => {
  let mockProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProps = createMockProps();
  });

  describe('startTimer', () => {
    it('should create timer with correct data and call set()', async () => {
      const { result } = renderHook(() => useTimer(mockProps));

      await act(async () => {
        result.current.startTimer(300);
      });

      expect(set).toHaveBeenCalledTimes(1);
      const callArgs = set.mock.calls[0][1];
      expect(callArgs.duration).toBe(300);
      expect(callArgs.isRunning).toBe(true);
      expect(callArgs.pausedRemaining).toBe(null);
      expect(callArgs.phase).toBe('CREATION');
      expect(typeof callArgs.startedAt).toBe('number');
    });

    it('should call setTimerData with correct data', async () => {
      const setTimerDataMock = vi.fn();
      const props = createMockProps({ setTimerData: setTimerDataMock });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.startTimer(300);
      });

      expect(setTimerDataMock).toHaveBeenCalledTimes(1);
      const callArgs = setTimerDataMock.mock.calls[0][0];
      expect(callArgs.duration).toBe(300);
      expect(callArgs.isRunning).toBe(true);
    });

    it('should return early if boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const setTimerDataMock = vi.fn();
      props.setTimerData = setTimerDataMock;
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.startTimer(300);
      });

      expect(set).not.toHaveBeenCalled();
      expect(setTimerDataMock).not.toHaveBeenCalled();
    });

    it('should return early if user is null', async () => {
      const props = createMockProps({ user: null });
      const setTimerDataMock = vi.fn();
      props.setTimerData = setTimerDataMock;
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.startTimer(300);
      });

      expect(set).not.toHaveBeenCalled();
      expect(setTimerDataMock).not.toHaveBeenCalled();
    });

    it('should include workflowPhase in timer data', async () => {
      const props = createMockProps({ workflowPhase: 'INTERACTIONS' });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.startTimer(600);
      });

      const callArgs = set.mock.calls[0][1];
      expect(callArgs.phase).toBe('INTERACTIONS');
    });

    it('should handle Firebase set() errors', async () => {
      vi.mocked(set).mockRejectedValueOnce(new Error('Firebase error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useTimer(mockProps));

      await act(async () => {
        result.current.startTimer(300);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error starting timer:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should use Date.now() for startedAt timestamp', async () => {
      const { result } = renderHook(() => useTimer(mockProps));
      const beforeTime = Date.now();

      await act(async () => {
        result.current.startTimer(300);
      });

      const callArgs = set.mock.calls[0][1];
      expect(callArgs.startedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.startedAt).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('pauseTimer', () => {
    it('should pause timer and calculate remaining time correctly', async () => {
      const now = Date.now();
      const timerData = {
        duration: 300,
        startedAt: now - 100 * 1000, // 100 seconds ago
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      const props = createMockProps({ timerData });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.pauseTimer();
      });

      const callArgs = set.mock.calls[0][1];
      expect(callArgs.isRunning).toBe(false);
      expect(callArgs.startedAt).toBe(null);
      expect(callArgs.pausedRemaining).toBeGreaterThan(0);
      expect(callArgs.pausedRemaining).toBeLessThanOrEqual(200); // 300 - 100
    });

    it('should set pausedRemaining to 0 if timer expired', async () => {
      const now = Date.now();
      const timerData = {
        duration: 100,
        startedAt: now - 200 * 1000, // 200 seconds ago
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      const props = createMockProps({ timerData });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.pauseTimer();
      });

      const callArgs = set.mock.calls[0][1];
      expect(callArgs.pausedRemaining).toBe(0);
    });

    it('should call setTimerData with updated timer', async () => {
      const now = Date.now();
      const timerData = {
        duration: 300,
        startedAt: now - 50 * 1000,
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      const setTimerDataMock = vi.fn();
      const props = createMockProps({ timerData, setTimerData: setTimerDataMock });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.pauseTimer();
      });

      expect(setTimerDataMock).toHaveBeenCalledTimes(1);
      const callArgs = setTimerDataMock.mock.calls[0][0];
      expect(callArgs.isRunning).toBe(false);
      expect(callArgs.startedAt).toBe(null);
    });

    it('should return early if timerData is null', async () => {
      const props = createMockProps({ timerData: null });
      const setTimerDataMock = vi.fn();
      props.setTimerData = setTimerDataMock;
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.pauseTimer();
      });

      expect(set).not.toHaveBeenCalled();
      expect(setTimerDataMock).not.toHaveBeenCalled();
    });

    it('should return early if boardId is null', async () => {
      const timerData = {
        duration: 300,
        startedAt: Date.now() - 50 * 1000,
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      const props = createMockProps({ boardId: null, timerData });
      const setTimerDataMock = vi.fn();
      props.setTimerData = setTimerDataMock;
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.pauseTimer();
      });

      expect(set).not.toHaveBeenCalled();
      expect(setTimerDataMock).not.toHaveBeenCalled();
    });

    it('should return early if user is null', async () => {
      const timerData = {
        duration: 300,
        startedAt: Date.now() - 50 * 1000,
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      const props = createMockProps({ user: null, timerData });
      const setTimerDataMock = vi.fn();
      props.setTimerData = setTimerDataMock;
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.pauseTimer();
      });

      expect(set).not.toHaveBeenCalled();
      expect(setTimerDataMock).not.toHaveBeenCalled();
    });

    it('should handle Firebase set() errors', async () => {
      const timerData = {
        duration: 300,
        startedAt: Date.now() - 50 * 1000,
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      vi.mocked(set).mockRejectedValueOnce(new Error('Firebase error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const props = createMockProps({ timerData });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.pauseTimer();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error pausing timer:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('resumeTimer', () => {
    it('should resume timer using pausedRemaining as new duration', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 150,
        phase: 'CREATION'
      };
      const props = createMockProps({ timerData });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.resumeTimer();
      });

      const callArgs = set.mock.calls[0][1];
      expect(callArgs.duration).toBe(150);
      expect(callArgs.isRunning).toBe(true);
      expect(callArgs.pausedRemaining).toBe(null);
      expect(typeof callArgs.startedAt).toBe('number');
    });

    it('should call setTimerData with updated timer', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 150,
        phase: 'CREATION'
      };
      const setTimerDataMock = vi.fn();
      const props = createMockProps({ timerData, setTimerData: setTimerDataMock });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.resumeTimer();
      });

      expect(setTimerDataMock).toHaveBeenCalledTimes(1);
      const callArgs = setTimerDataMock.mock.calls[0][0];
      expect(callArgs.duration).toBe(150);
      expect(callArgs.isRunning).toBe(true);
    });

    it('should return early if pausedRemaining is null', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      const props = createMockProps({ timerData });
      const setTimerDataMock = vi.fn();
      props.setTimerData = setTimerDataMock;
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.resumeTimer();
      });

      expect(set).not.toHaveBeenCalled();
      expect(setTimerDataMock).not.toHaveBeenCalled();
    });

    it('should return early if timerData is null', async () => {
      const props = createMockProps({ timerData: null });
      const setTimerDataMock = vi.fn();
      props.setTimerData = setTimerDataMock;
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.resumeTimer();
      });

      expect(set).not.toHaveBeenCalled();
      expect(setTimerDataMock).not.toHaveBeenCalled();
    });

    it('should return early if boardId is null', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 150,
        phase: 'CREATION'
      };
      const props = createMockProps({ boardId: null, timerData });
      const setTimerDataMock = vi.fn();
      props.setTimerData = setTimerDataMock;
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.resumeTimer();
      });

      expect(set).not.toHaveBeenCalled();
      expect(setTimerDataMock).not.toHaveBeenCalled();
    });

    it('should return early if user is null', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 150,
        phase: 'CREATION'
      };
      const props = createMockProps({ user: null, timerData });
      const setTimerDataMock = vi.fn();
      props.setTimerData = setTimerDataMock;
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.resumeTimer();
      });

      expect(set).not.toHaveBeenCalled();
      expect(setTimerDataMock).not.toHaveBeenCalled();
    });

    it('should handle Firebase set() errors', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 150,
        phase: 'CREATION'
      };
      vi.mocked(set).mockRejectedValueOnce(new Error('Firebase error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const props = createMockProps({ timerData });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.resumeTimer();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error resuming timer:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('resetTimer', () => {
    it('should call remove() to reset timer', async () => {
      const timerData = {
        duration: 300,
        startedAt: Date.now(),
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      const props = createMockProps({ timerData });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.resetTimer();
      });

      expect(remove).toHaveBeenCalledWith('mock-ref');
      expect(set).not.toHaveBeenCalled();
    });

    it('should call setTimerData(null) after reset', async () => {
      const timerData = {
        duration: 300,
        startedAt: Date.now(),
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      const setTimerDataMock = vi.fn();
      const props = createMockProps({ timerData, setTimerData: setTimerDataMock });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.resetTimer();
      });

      expect(setTimerDataMock).toHaveBeenCalledWith(null);
    });

    it('should return early if boardId is null', async () => {
      const timerData = {
        duration: 300,
        startedAt: Date.now(),
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      const props = createMockProps({ boardId: null, timerData });
      const setTimerDataMock = vi.fn();
      props.setTimerData = setTimerDataMock;
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.resetTimer();
      });

      expect(remove).not.toHaveBeenCalled();
      expect(setTimerDataMock).not.toHaveBeenCalled();
    });

    it('should return early if user is null', async () => {
      const timerData = {
        duration: 300,
        startedAt: Date.now(),
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      const props = createMockProps({ user: null, timerData });
      const setTimerDataMock = vi.fn();
      props.setTimerData = setTimerDataMock;
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.resetTimer();
      });

      expect(remove).not.toHaveBeenCalled();
      expect(setTimerDataMock).not.toHaveBeenCalled();
    });

    it('should handle Firebase remove() errors', async () => {
      const timerData = {
        duration: 300,
        startedAt: Date.now(),
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      vi.mocked(remove).mockRejectedValueOnce(new Error('Firebase error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const props = createMockProps({ timerData });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.resetTimer();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error resetting timer:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('restartTimer', () => {
    it('should restart timer preserving original duration', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 100,
        phase: 'CREATION'
      };
      const props = createMockProps({ timerData });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.restartTimer();
      });

      const callArgs = set.mock.calls[0][1];
      expect(callArgs.duration).toBe(300); // Original duration, not pausedRemaining
      expect(callArgs.isRunning).toBe(true);
      expect(callArgs.pausedRemaining).toBe(null);
      expect(typeof callArgs.startedAt).toBe('number');
    });

    it('should call setTimerData with restarted timer', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 100,
        phase: 'CREATION'
      };
      const setTimerDataMock = vi.fn();
      const props = createMockProps({ timerData, setTimerData: setTimerDataMock });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.restartTimer();
      });

      expect(setTimerDataMock).toHaveBeenCalledTimes(1);
      const callArgs = setTimerDataMock.mock.calls[0][0];
      expect(callArgs.duration).toBe(300);
      expect(callArgs.isRunning).toBe(true);
    });

    it('should include workflowPhase in restarted timer', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 100,
        phase: 'CREATION'
      };
      const props = createMockProps({ timerData, workflowPhase: 'INTERACTIONS' });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.restartTimer();
      });

      const callArgs = set.mock.calls[0][1];
      expect(callArgs.phase).toBe('INTERACTIONS');
    });

    it('should use Date.now() for new startedAt', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 100,
        phase: 'CREATION'
      };
      const props = createMockProps({ timerData });
      const { result } = renderHook(() => useTimer(props));
      const beforeTime = Date.now();

      await act(async () => {
        result.current.restartTimer();
      });

      const callArgs = set.mock.calls[0][1];
      expect(callArgs.startedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.startedAt).toBeLessThanOrEqual(Date.now());
    });

    it('should return early if timerData is null', async () => {
      const props = createMockProps({ timerData: null });
      const setTimerDataMock = vi.fn();
      props.setTimerData = setTimerDataMock;
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.restartTimer();
      });

      expect(set).not.toHaveBeenCalled();
      expect(setTimerDataMock).not.toHaveBeenCalled();
    });

    it('should return early if boardId is null', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 100,
        phase: 'CREATION'
      };
      const props = createMockProps({ boardId: null, timerData });
      const setTimerDataMock = vi.fn();
      props.setTimerData = setTimerDataMock;
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.restartTimer();
      });

      expect(set).not.toHaveBeenCalled();
      expect(setTimerDataMock).not.toHaveBeenCalled();
    });

    it('should return early if user is null', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 100,
        phase: 'CREATION'
      };
      const props = createMockProps({ user: null, timerData });
      const setTimerDataMock = vi.fn();
      props.setTimerData = setTimerDataMock;
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.restartTimer();
      });

      expect(set).not.toHaveBeenCalled();
      expect(setTimerDataMock).not.toHaveBeenCalled();
    });

    it('should handle Firebase set() errors', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 100,
        phase: 'CREATION'
      };
      vi.mocked(set).mockRejectedValueOnce(new Error('Firebase error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const props = createMockProps({ timerData });
      const { result } = renderHook(() => useTimer(props));

      await act(async () => {
        result.current.restartTimer();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error restarting timer:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('hook return value', () => {
    it('should return all 5 timer operations', () => {
      const { result } = renderHook(() => useTimer(mockProps));

      expect(result.current).toHaveProperty('startTimer');
      expect(result.current).toHaveProperty('pauseTimer');
      expect(result.current).toHaveProperty('resumeTimer');
      expect(result.current).toHaveProperty('resetTimer');
      expect(result.current).toHaveProperty('restartTimer');
    });

    it('should return all operations as functions', () => {
      const { result } = renderHook(() => useTimer(mockProps));

      expect(typeof result.current.startTimer).toBe('function');
      expect(typeof result.current.pauseTimer).toBe('function');
      expect(typeof result.current.resumeTimer).toBe('function');
      expect(typeof result.current.resetTimer).toBe('function');
      expect(typeof result.current.restartTimer).toBe('function');
    });

    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useTimer(mockProps));
      const firstStartTimer = result.current.startTimer;
      const firstPauseTimer = result.current.pauseTimer;

      rerender();

      expect(result.current.startTimer).toBe(firstStartTimer);
      expect(result.current.pauseTimer).toBe(firstPauseTimer);
    });
  });

  describe('timer operations integration', () => {
    it('should support full timer lifecycle: start -> pause -> resume -> restart -> reset', async () => {
      const setTimerDataMock = vi.fn();
      let props = createMockProps({ setTimerData: setTimerDataMock, timerData: null });
      const { result, rerender } = renderHook(() => useTimer(props));

      // Start timer
      await act(async () => {
        result.current.startTimer(300);
      });
      expect(set).toHaveBeenCalledTimes(1);

      // Pause timer
      const timerData = {
        duration: 300,
        startedAt: Date.now() - 50 * 1000,
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      props = createMockProps({ setTimerData: setTimerDataMock, timerData });
      rerender();

      vi.clearAllMocks();
      await act(async () => {
        result.current.pauseTimer();
      });
      expect(set).toHaveBeenCalledTimes(1);

      // Resume timer
      const pausedTimerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 150,
        phase: 'CREATION'
      };
      props = createMockProps({ setTimerData: setTimerDataMock, timerData: pausedTimerData });
      rerender();

      vi.clearAllMocks();
      await act(async () => {
        result.current.resumeTimer();
      });
      expect(set).toHaveBeenCalledTimes(1);

      // Restart timer
      vi.clearAllMocks();
      await act(async () => {
        result.current.restartTimer();
      });
      expect(set).toHaveBeenCalledTimes(1);

      // Reset timer
      vi.clearAllMocks();
      await act(async () => {
        result.current.resetTimer();
      });
      expect(remove).toHaveBeenCalledTimes(1);
    });
  });
});
