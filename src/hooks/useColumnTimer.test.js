import { renderHook, act } from '@testing-library/react';
import { set, remove } from 'firebase/database';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useColumnTimer } from './useColumnTimer';

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
  workflowPhase: 'CREATION',
  ...overrides
});

describe('useColumnTimer', () => {
  let mockProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProps = createMockProps();
  });

  describe('startColumnTimer', () => {
    it('should create timer with correct data and call set()', async () => {
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.startColumnTimer('col-1', 300);
      });

      expect(set).toHaveBeenCalledTimes(1);
      const callArgs = set.mock.calls[0][1];
      expect(callArgs.duration).toBe(300);
      expect(callArgs.isRunning).toBe(true);
      expect(callArgs.pausedRemaining).toBe(null);
      expect(callArgs.phase).toBe('CREATION');
      expect(typeof callArgs.startedAt).toBe('number');
    });

    it('should return early if boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useColumnTimer(props));

      await act(async () => {
        result.current.startColumnTimer('col-1', 300);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should return early if user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useColumnTimer(props));

      await act(async () => {
        result.current.startColumnTimer('col-1', 300);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should return early if columnId is falsy', async () => {
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.startColumnTimer(null, 300);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should include workflowPhase in timer data', async () => {
      const props = createMockProps({ workflowPhase: 'INTERACTIONS' });
      const { result } = renderHook(() => useColumnTimer(props));

      await act(async () => {
        result.current.startColumnTimer('col-1', 600);
      });

      const callArgs = set.mock.calls[0][1];
      expect(callArgs.phase).toBe('INTERACTIONS');
    });

    it('should handle Firebase set() errors', async () => {
      vi.mocked(set).mockRejectedValueOnce(new Error('Firebase error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.startColumnTimer('col-1', 300);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error starting column timer:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should use Date.now() for startedAt timestamp', async () => {
      const { result } = renderHook(() => useColumnTimer(mockProps));
      const beforeTime = Date.now();

      await act(async () => {
        result.current.startColumnTimer('col-1', 300);
      });

      const callArgs = set.mock.calls[0][1];
      expect(callArgs.startedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.startedAt).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('pauseColumnTimer', () => {
    it('should pause timer and calculate remaining time correctly', async () => {
      const now = Date.now();
      const timerData = {
        duration: 300,
        startedAt: now - 100 * 1000, // 100 seconds ago
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.pauseColumnTimer('col-1', timerData);
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
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.pauseColumnTimer('col-1', timerData);
      });

      const callArgs = set.mock.calls[0][1];
      expect(callArgs.pausedRemaining).toBe(0);
    });

    it('should return early if timerData is null', async () => {
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.pauseColumnTimer('col-1', null);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should return early if boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useColumnTimer(props));
      const timerData = {
        duration: 300,
        startedAt: Date.now() - 50 * 1000,
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };

      await act(async () => {
        result.current.pauseColumnTimer('col-1', timerData);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should handle Firebase set() errors', async () => {
      vi.mocked(set).mockRejectedValueOnce(new Error('Firebase error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const timerData = {
        duration: 300,
        startedAt: Date.now() - 50 * 1000,
        isRunning: true,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.pauseColumnTimer('col-1', timerData);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error pausing column timer:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('resumeColumnTimer', () => {
    it('should resume timer using pausedRemaining as new duration', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 150,
        phase: 'CREATION'
      };
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.resumeColumnTimer('col-1', timerData);
      });

      const callArgs = set.mock.calls[0][1];
      expect(callArgs.duration).toBe(150);
      expect(callArgs.isRunning).toBe(true);
      expect(callArgs.pausedRemaining).toBe(null);
      expect(typeof callArgs.startedAt).toBe('number');
    });

    it('should return early if pausedRemaining is null', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: null,
        phase: 'CREATION'
      };
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.resumeColumnTimer('col-1', timerData);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should return early if timerData is null', async () => {
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.resumeColumnTimer('col-1', null);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should handle Firebase set() errors', async () => {
      vi.mocked(set).mockRejectedValueOnce(new Error('Firebase error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 150,
        phase: 'CREATION'
      };
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.resumeColumnTimer('col-1', timerData);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error resuming column timer:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('resetColumnTimer', () => {
    it('should call remove() to reset timer', async () => {
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.resetColumnTimer('col-1');
      });

      expect(remove).toHaveBeenCalledWith('mock-ref');
      expect(set).not.toHaveBeenCalled();
    });

    it('should return early if boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useColumnTimer(props));

      await act(async () => {
        result.current.resetColumnTimer('col-1');
      });

      expect(remove).not.toHaveBeenCalled();
    });

    it('should return early if user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useColumnTimer(props));

      await act(async () => {
        result.current.resetColumnTimer('col-1');
      });

      expect(remove).not.toHaveBeenCalled();
    });

    it('should return early if columnId is falsy', async () => {
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.resetColumnTimer(null);
      });

      expect(remove).not.toHaveBeenCalled();
    });

    it('should handle Firebase remove() errors', async () => {
      vi.mocked(remove).mockRejectedValueOnce(new Error('Firebase error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.resetColumnTimer('col-1');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error resetting column timer:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('restartColumnTimer', () => {
    it('should restart timer preserving original duration', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 100,
        phase: 'CREATION'
      };
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.restartColumnTimer('col-1', timerData);
      });

      const callArgs = set.mock.calls[0][1];
      expect(callArgs.duration).toBe(300); // Original duration, not pausedRemaining
      expect(callArgs.isRunning).toBe(true);
      expect(callArgs.pausedRemaining).toBe(null);
      expect(typeof callArgs.startedAt).toBe('number');
    });

    it('should include workflowPhase in restarted timer', async () => {
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 100,
        phase: 'CREATION'
      };
      const props = createMockProps({ workflowPhase: 'INTERACTIONS' });
      const { result } = renderHook(() => useColumnTimer(props));

      await act(async () => {
        result.current.restartColumnTimer('col-1', timerData);
      });

      const callArgs = set.mock.calls[0][1];
      expect(callArgs.phase).toBe('INTERACTIONS');
    });

    it('should return early if timerData is null', async () => {
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.restartColumnTimer('col-1', null);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should return early if boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 100,
        phase: 'CREATION'
      };
      const { result } = renderHook(() => useColumnTimer(props));

      await act(async () => {
        result.current.restartColumnTimer('col-1', timerData);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should handle Firebase set() errors', async () => {
      vi.mocked(set).mockRejectedValueOnce(new Error('Firebase error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const timerData = {
        duration: 300,
        startedAt: null,
        isRunning: false,
        pausedRemaining: 100,
        phase: 'CREATION'
      };
      const { result } = renderHook(() => useColumnTimer(mockProps));

      await act(async () => {
        result.current.restartColumnTimer('col-1', timerData);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error restarting column timer:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('hook return value', () => {
    it('should return all 5 timer operations', () => {
      const { result } = renderHook(() => useColumnTimer(mockProps));

      expect(result.current).toHaveProperty('startColumnTimer');
      expect(result.current).toHaveProperty('pauseColumnTimer');
      expect(result.current).toHaveProperty('resumeColumnTimer');
      expect(result.current).toHaveProperty('resetColumnTimer');
      expect(result.current).toHaveProperty('restartColumnTimer');
    });

    it('should return all operations as functions', () => {
      const { result } = renderHook(() => useColumnTimer(mockProps));

      expect(typeof result.current.startColumnTimer).toBe('function');
      expect(typeof result.current.pauseColumnTimer).toBe('function');
      expect(typeof result.current.resumeColumnTimer).toBe('function');
      expect(typeof result.current.resetColumnTimer).toBe('function');
      expect(typeof result.current.restartColumnTimer).toBe('function');
    });

    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useColumnTimer(mockProps));
      const firstStart = result.current.startColumnTimer;
      const firstPause = result.current.pauseColumnTimer;

      rerender();

      expect(result.current.startColumnTimer).toBe(firstStart);
      expect(result.current.pauseColumnTimer).toBe(firstPause);
    });
  });

  describe('timer operations integration', () => {
    it('should support full timer lifecycle: start -> pause -> resume -> restart -> reset', async () => {
      const { result } = renderHook(() => useColumnTimer(mockProps));
      const colId = 'col-1';

      // Start timer
      await act(async () => {
        result.current.startColumnTimer(colId, 300);
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
      vi.clearAllMocks();
      await act(async () => {
        result.current.pauseColumnTimer(colId, timerData);
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
      vi.clearAllMocks();
      await act(async () => {
        result.current.resumeColumnTimer(colId, pausedTimerData);
      });
      expect(set).toHaveBeenCalledTimes(1);

      // Restart timer
      vi.clearAllMocks();
      await act(async () => {
        result.current.restartColumnTimer(colId, pausedTimerData);
      });
      expect(set).toHaveBeenCalledTimes(1);

      // Reset timer
      vi.clearAllMocks();
      await act(async () => {
        result.current.resetColumnTimer(colId);
      });
      expect(remove).toHaveBeenCalledTimes(1);
    });
  });
});
