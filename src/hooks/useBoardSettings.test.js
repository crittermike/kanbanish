import { renderHook, act } from '@testing-library/react';
import { ref, set } from 'firebase/database';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import { useBoardSettings } from './useBoardSettings';

vi.mock('../utils/firebase', () => ({
  database: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve())
}));

vi.mock('../utils/workflowUtils', () => ({
  WORKFLOW_PHASES: {
    HEALTH_CHECK: 'HEALTH_CHECK',
    HEALTH_CHECK_RESULTS: 'HEALTH_CHECK_RESULTS',
    CREATION: 'CREATION',
    GROUPING: 'GROUPING',
    INTERACTIONS: 'INTERACTIONS',
    RESULTS: 'RESULTS',
    POLL: 'POLL',
    POLL_RESULTS: 'POLL_RESULTS'
  }
}));

const createMockSetters = () => ({
  setVotingEnabled: vi.fn(),
  setDownvotingEnabled: vi.fn(),
  setMultipleVotesAllowed: vi.fn(),
  setVotesPerUser: vi.fn(),
  setSortByVotesState: vi.fn(),
  setRetrospectiveMode: vi.fn(),
  setWorkflowPhase: vi.fn(),
  setResultsViewIndex: vi.fn()
});

const createMockProps = (overrides = {}) => {
  const setters = createMockSetters();
  return {
    boardId: 'board-123',
    user: { uid: 'user1' },
    settingsState: {
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      votesPerUser: 3,
      sortByVotes: false,
      retrospectiveMode: false,
      workflowPhase: 'CREATION',
      resultsViewIndex: 0,
      ...overrides.settingsState
    },
    setters: {
      ...setters,
      ...overrides.setters
    },
    ...('boardId' in overrides ? { boardId: overrides.boardId } : {}),
    ...('user' in overrides ? { user: overrides.user } : {})
  };
};

describe('useBoardSettings', () => {
  let mockProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProps = createMockProps();
  });

  describe('updateBoardSettings', () => {
    it('should write merged settings to Firebase when boardId and user exist', async () => {
      const { result } = renderHook(() => useBoardSettings(mockProps));

      await act(async () => {
        result.current.updateBoardSettings({ votingEnabled: false });
      });

      expect(ref).toHaveBeenCalledWith({}, 'boards/board-123/settings');
      expect(set).toHaveBeenCalledWith('mock-ref', {
        votingEnabled: false,
        downvotingEnabled: false,
        multipleVotesAllowed: false,
        votesPerUser: 3,
        sortByVotes: false,
        retrospectiveMode: false,
        workflowPhase: 'CREATION',
        resultsViewIndex: 0
      });
    });

    it('should call applySettingsLocally after successful Firebase write', async () => {
      const { result } = renderHook(() => useBoardSettings(mockProps));

      await act(async () => {
        result.current.updateBoardSettings({ votingEnabled: false });
      });

      expect(mockProps.setters.setVotingEnabled).toHaveBeenCalledWith(false);
    });

    it('should only update local state when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateBoardSettings({ votingEnabled: false });
      });

      expect(set).not.toHaveBeenCalled();
      expect(props.setters.setVotingEnabled).toHaveBeenCalledWith(false);
    });

    it('should only update local state when user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateBoardSettings({ sortByVotes: true });
      });

      expect(set).not.toHaveBeenCalled();
      expect(props.setters.setSortByVotesState).toHaveBeenCalledWith(true);
    });

    it('should merge new settings with existing state for Firebase write', async () => {
      const props = createMockProps({
        settingsState: {
          votingEnabled: true,
          downvotingEnabled: true,
          multipleVotesAllowed: true,
          votesPerUser: 5,
          sortByVotes: true,
          retrospectiveMode: true,
          workflowPhase: 'INTERACTIONS',
          resultsViewIndex: 2
        }
      });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateBoardSettings({ votesPerUser: 10 });
      });

      expect(set).toHaveBeenCalledWith('mock-ref', {
        votingEnabled: true,
        downvotingEnabled: true,
        multipleVotesAllowed: true,
        votesPerUser: 10,
        sortByVotes: true,
        retrospectiveMode: true,
        workflowPhase: 'INTERACTIONS',
        resultsViewIndex: 2
      });
    });
  });

  describe('applySettingsLocally', () => {
    it('should call setVotingEnabled when votingEnabled is in settings', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateBoardSettings({ votingEnabled: true });
      });

      expect(props.setters.setVotingEnabled).toHaveBeenCalledWith(true);
    });

    it('should call setDownvotingEnabled when downvotingEnabled is in settings', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateBoardSettings({ downvotingEnabled: true });
      });

      expect(props.setters.setDownvotingEnabled).toHaveBeenCalledWith(true);
    });

    it('should call setMultipleVotesAllowed when multipleVotesAllowed is in settings', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateBoardSettings({ multipleVotesAllowed: true });
      });

      expect(props.setters.setMultipleVotesAllowed).toHaveBeenCalledWith(true);
    });

    it('should call setVotesPerUser when votesPerUser is in settings', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateBoardSettings({ votesPerUser: 10 });
      });

      expect(props.setters.setVotesPerUser).toHaveBeenCalledWith(10);
    });

    it('should call setSortByVotesState when sortByVotes is in settings', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateBoardSettings({ sortByVotes: true });
      });

      expect(props.setters.setSortByVotesState).toHaveBeenCalledWith(true);
    });

    it('should call setRetrospectiveMode when retrospectiveMode is in settings', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateBoardSettings({ retrospectiveMode: true });
      });

      expect(props.setters.setRetrospectiveMode).toHaveBeenCalledWith(true);
    });

    it('should call setWorkflowPhase when workflowPhase is in settings', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateBoardSettings({ workflowPhase: 'GROUPING' });
      });

      expect(props.setters.setWorkflowPhase).toHaveBeenCalledWith('GROUPING');
    });

    it('should call setResultsViewIndex when resultsViewIndex is in settings', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateBoardSettings({ resultsViewIndex: 3 });
      });

      expect(props.setters.setResultsViewIndex).toHaveBeenCalledWith(3);
    });

    it('should not call unrelated setters for a partial update', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateBoardSettings({ votingEnabled: false });
      });

      expect(props.setters.setVotingEnabled).toHaveBeenCalledWith(false);
      expect(props.setters.setDownvotingEnabled).not.toHaveBeenCalled();
      expect(props.setters.setMultipleVotesAllowed).not.toHaveBeenCalled();
      expect(props.setters.setVotesPerUser).not.toHaveBeenCalled();
      expect(props.setters.setSortByVotesState).not.toHaveBeenCalled();
      expect(props.setters.setRetrospectiveMode).not.toHaveBeenCalled();
      expect(props.setters.setWorkflowPhase).not.toHaveBeenCalled();
      expect(props.setters.setResultsViewIndex).not.toHaveBeenCalled();
    });
  });

  describe('Convenience Wrappers', () => {
    it('should call updateBoardSettings with votingEnabled via updateVotingEnabled', async () => {
      const { result } = renderHook(() => useBoardSettings(mockProps));

      await act(async () => {
        result.current.updateVotingEnabled(false);
      });

      expect(set).toHaveBeenCalled();
      const settingsArg = set.mock.calls[0][1];
      expect(settingsArg.votingEnabled).toBe(false);
    });

    it('should call updateBoardSettings with downvotingEnabled via updateDownvotingEnabled', async () => {
      const { result } = renderHook(() => useBoardSettings(mockProps));

      await act(async () => {
        result.current.updateDownvotingEnabled(true);
      });

      expect(set).toHaveBeenCalled();
      const settingsArg = set.mock.calls[0][1];
      expect(settingsArg.downvotingEnabled).toBe(true);
    });

    it('should call updateBoardSettings with multipleVotesAllowed via updateMultipleVotesAllowed', async () => {
      const { result } = renderHook(() => useBoardSettings(mockProps));

      await act(async () => {
        result.current.updateMultipleVotesAllowed(true);
      });

      expect(set).toHaveBeenCalled();
      const settingsArg = set.mock.calls[0][1];
      expect(settingsArg.multipleVotesAllowed).toBe(true);
    });

    it('should call updateBoardSettings with votesPerUser via updateVotesPerUser', async () => {
      const { result } = renderHook(() => useBoardSettings(mockProps));

      await act(async () => {
        result.current.updateVotesPerUser(10);
      });

      expect(set).toHaveBeenCalled();
      const settingsArg = set.mock.calls[0][1];
      expect(settingsArg.votesPerUser).toBe(10);
    });

    it('should call updateBoardSettings with sortByVotes via setSortByVotes', async () => {
      const { result } = renderHook(() => useBoardSettings(mockProps));

      await act(async () => {
        result.current.setSortByVotes(true);
      });

      expect(set).toHaveBeenCalled();
      const settingsArg = set.mock.calls[0][1];
      expect(settingsArg.sortByVotes).toBe(true);
    });
  });

  describe('updateRetrospectiveMode', () => {
    it('should set HEALTH_CHECK phase when enabling retrospective mode', async () => {
      const { result } = renderHook(() => useBoardSettings(mockProps));

      await act(async () => {
        result.current.updateRetrospectiveMode(true);
      });

      expect(set).toHaveBeenCalled();
      const settingsArg = set.mock.calls[0][1];
      expect(settingsArg.retrospectiveMode).toBe(true);
      expect(settingsArg.workflowPhase).toBe(WORKFLOW_PHASES.HEALTH_CHECK);
    });

    it('should reset to CREATION phase when disabling retrospective mode', async () => {
      const props = createMockProps({
        settingsState: {
          votingEnabled: true,
          downvotingEnabled: false,
          multipleVotesAllowed: false,
          votesPerUser: 3,
          sortByVotes: false,
          retrospectiveMode: true,
          workflowPhase: 'INTERACTIONS',
          resultsViewIndex: 2
        }
      });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateRetrospectiveMode(false);
      });

      expect(set).toHaveBeenCalled();
      const settingsArg = set.mock.calls[0][1];
      expect(settingsArg.retrospectiveMode).toBe(false);
      expect(settingsArg.workflowPhase).toBe(WORKFLOW_PHASES.CREATION);
      expect(settingsArg.resultsViewIndex).toBe(0);
    });

    it('should not reset resultsViewIndex when enabling retrospective mode', async () => {
      const props = createMockProps({
        settingsState: {
          votingEnabled: true,
          downvotingEnabled: false,
          multipleVotesAllowed: false,
          votesPerUser: 3,
          sortByVotes: false,
          retrospectiveMode: false,
          workflowPhase: 'CREATION',
          resultsViewIndex: 5
        }
      });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateRetrospectiveMode(true);
      });

      const settingsArg = set.mock.calls[0][1];
      // When enabling, resultsViewIndex should remain from existing state (5)
      expect(settingsArg.resultsViewIndex).toBe(5);
    });

    it('should write to Firebase when boardId and user are present', async () => {
      const { result } = renderHook(() => useBoardSettings(mockProps));

      await act(async () => {
        result.current.updateRetrospectiveMode(true);
      });

      expect(ref).toHaveBeenCalledWith({}, 'boards/board-123/settings');
      expect(set).toHaveBeenCalled();
    });

    it('should only update local state when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useBoardSettings(props));

      await act(async () => {
        result.current.updateRetrospectiveMode(true);
      });

      expect(set).not.toHaveBeenCalled();
      expect(props.setters.setRetrospectiveMode).toHaveBeenCalledWith(true);
      expect(props.setters.setWorkflowPhase).toHaveBeenCalledWith(WORKFLOW_PHASES.HEALTH_CHECK);
    });
  });
});
