import { ref, set } from 'firebase/database';
import { useCallback } from 'react';
import { database } from '../utils/firebase';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';

/**
 * Hook for board settings management.
 *
 * Handles reading/writing all board settings to Firebase, plus convenience
 * wrappers for individual setting toggles.
 *
 * @param {Object} params
 * @param {string|null} params.boardId - Current board ID
 * @param {Object|null} params.user - Current Firebase user
 * @param {Object} params.settingsState - Current settings values
 * @param {boolean} params.settingsState.votingEnabled
 * @param {boolean} params.settingsState.downvotingEnabled
 * @param {boolean} params.settingsState.multipleVotesAllowed
 * @param {number} params.settingsState.votesPerUser
 * @param {boolean} params.settingsState.sortByVotes
 * @param {boolean} params.settingsState.retrospectiveMode
 * @param {string} params.settingsState.workflowPhase
 * @param {number} params.settingsState.resultsViewIndex
 * @param {boolean} params.settingsState.showDisplayNames
 * @param {Object} params.setters - State setter functions
 * @returns {Object} Settings operations
 */
export const useBoardSettings = ({ boardId, user, settingsState, setters }) => {
  const {
    votingEnabled, downvotingEnabled, multipleVotesAllowed,
    votesPerUser, sortByVotes, retrospectiveMode,
    workflowPhase, resultsViewIndex, showDisplayNames, actionItemsEnabled,
    skipRevealPhase,
    backgroundId, customBackgroundCss
  } = settingsState;

  const {
    setVotingEnabled, setDownvotingEnabled, setMultipleVotesAllowed,
    setVotesPerUser, setSortByVotesState, setRetrospectiveMode,
    setWorkflowPhase, setResultsViewIndex, setShowDisplayNames, setActionItemsEnabled,
    setSkipRevealPhase,
    setBackgroundId, setCustomBackgroundCss
  } = setters;

  const applySettingsLocally = useCallback((newSettings) => {
    if (newSettings.votingEnabled !== undefined) {
      setVotingEnabled(newSettings.votingEnabled);
    }
    if (newSettings.downvotingEnabled !== undefined) {
      setDownvotingEnabled(newSettings.downvotingEnabled);
    }
    if (newSettings.multipleVotesAllowed !== undefined) {
      setMultipleVotesAllowed(newSettings.multipleVotesAllowed);
    }
    if (newSettings.votesPerUser !== undefined) {
      setVotesPerUser(newSettings.votesPerUser);
    }
    if (newSettings.sortByVotes !== undefined) {
      setSortByVotesState(newSettings.sortByVotes);
    }
    if (newSettings.retrospectiveMode !== undefined) {
      setRetrospectiveMode(newSettings.retrospectiveMode);
    }
    if (newSettings.workflowPhase !== undefined) {
      setWorkflowPhase(newSettings.workflowPhase);
    }
    if (newSettings.resultsViewIndex !== undefined) {
      setResultsViewIndex(newSettings.resultsViewIndex);
    }
    if (newSettings.showDisplayNames !== undefined) {
      setShowDisplayNames(newSettings.showDisplayNames);
    }
    if (newSettings.actionItemsEnabled !== undefined) {
      setActionItemsEnabled(newSettings.actionItemsEnabled);
    }
    if (newSettings.skipRevealPhase !== undefined) {
      setSkipRevealPhase(newSettings.skipRevealPhase);
    }
    if (newSettings.backgroundId !== undefined) {
      setBackgroundId(newSettings.backgroundId);
    }
    if (newSettings.customBackgroundCss !== undefined) {
      setCustomBackgroundCss(newSettings.customBackgroundCss);
    }
  }, [
    setVotingEnabled, setDownvotingEnabled, setMultipleVotesAllowed,
    setVotesPerUser, setSortByVotesState, setRetrospectiveMode,
    setWorkflowPhase, setResultsViewIndex, setShowDisplayNames, setActionItemsEnabled,
    setSkipRevealPhase,
    setBackgroundId, setCustomBackgroundCss
  ]);

  const updateBoardSettings = useCallback((newSettings) => {
    if (boardId && user) {
      const settingsRef = ref(database, `boards/${boardId}/settings`);
      // Merge new settings with existing state
      const updatedSettings = {
        votingEnabled,
        downvotingEnabled,
        multipleVotesAllowed,
        votesPerUser,
        sortByVotes,
        retrospectiveMode,
        workflowPhase,
        resultsViewIndex,
        showDisplayNames,
        actionItemsEnabled,
        skipRevealPhase,
        backgroundId,
        customBackgroundCss,
        ...newSettings
      };

      set(settingsRef, updatedSettings)
        .then(() => {
          applySettingsLocally(newSettings);
        })
        .catch(error => {
          console.error('Error updating board settings:', error);
        });
    } else {
      // If we're not connected to a board yet, just update the local state
      applySettingsLocally(newSettings);
    }
  }, [
    boardId, user, votingEnabled, downvotingEnabled, multipleVotesAllowed,
    votesPerUser, sortByVotes, retrospectiveMode, workflowPhase,
    resultsViewIndex, showDisplayNames, actionItemsEnabled,
    skipRevealPhase,
    backgroundId, customBackgroundCss, applySettingsLocally
  ]);

  // Convenience wrappers
  const updateVotingEnabled = useCallback((enabled) => {
    updateBoardSettings({ votingEnabled: enabled });
  }, [updateBoardSettings]);

  const updateDownvotingEnabled = useCallback((enabled) => {
    updateBoardSettings({ downvotingEnabled: enabled });
  }, [updateBoardSettings]);

  const updateMultipleVotesAllowed = useCallback((allowed) => {
    updateBoardSettings({ multipleVotesAllowed: allowed });
  }, [updateBoardSettings]);

  const updateVotesPerUser = useCallback((limit) => {
    updateBoardSettings({ votesPerUser: limit });
  }, [updateBoardSettings]);

  const updateShowDisplayNames = useCallback((enabled) => {
    updateBoardSettings({ showDisplayNames: enabled });
  }, [updateBoardSettings]);

  const setSortByVotes = useCallback((enabled) => {
    updateBoardSettings({ sortByVotes: enabled });
  }, [updateBoardSettings]);

  const updateRetrospectiveMode = useCallback((enabled) => {
    if (enabled) {
      // When enabling retrospective mode, start with health check phase
      updateBoardSettings({
        retrospectiveMode: enabled,
        workflowPhase: WORKFLOW_PHASES.HEALTH_CHECK
      });
    } else {
      // When disabling retrospective mode, also reset workflow to creation phase
      updateBoardSettings({
        retrospectiveMode: enabled,
        workflowPhase: WORKFLOW_PHASES.CREATION,
        resultsViewIndex: 0
      });
    }
  }, [updateBoardSettings]);

  const updateActionItemsEnabled = useCallback((enabled) => {
    updateBoardSettings({ actionItemsEnabled: enabled });
  }, [updateBoardSettings]);

  return {
    updateBoardSettings,
    updateVotingEnabled,
    updateDownvotingEnabled,
    updateMultipleVotesAllowed,
    updateVotesPerUser,
    setSortByVotes,
    updateRetrospectiveMode,
    updateShowDisplayNames,
    updateActionItemsEnabled
  };
};
