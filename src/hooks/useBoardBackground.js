import { useCallback } from 'react';

/**
 * Hook for managing board background settings.
 *
 * Persists the selected background ID to Firebase at
 * `boards/{boardId}/settings/backgroundId` via the shared
 * `updateBoardSettings` function, keeping it in sync with all
 * other board settings.
 *
 * @param {Object} params
 * @param {string|null} params.boardId - Current board ID
 * @param {Object|null} params.user - Current Firebase user
 * @param {Function} params.updateBoardSettings - From useBoardSettings
 * @returns {Object} Background operations
 */
export const useBoardBackground = ({ updateBoardSettings }) => {
  /**
   * Set the board background by ID.
   * Persists to Firebase via updateBoardSettings so all users see it.
   * @param {string} backgroundId - The background ID from boardBackgrounds.js
   */
  const setBoardBackground = useCallback((backgroundId) => {
    updateBoardSettings({ backgroundId });
  }, [updateBoardSettings]);

  /**
   * Set a custom background CSS value.
   * Stores both the custom flag and the raw CSS.
   * @param {string} customCss - Raw CSS background value
   */
  const setCustomBackground = useCallback((customCss) => {
    updateBoardSettings({
      backgroundId: 'custom',
      customBackgroundCss: customCss
    });
  }, [updateBoardSettings]);

  /**
   * Clear the board background (reset to default).
   */
  const clearBackground = useCallback(() => {
    updateBoardSettings({
      backgroundId: 'none',
      customBackgroundCss: ''
    });
  }, [updateBoardSettings]);

  return {
    setBoardBackground,
    setCustomBackground,
    clearBackground
  };
};
