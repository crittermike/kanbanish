import { ref, onValue, off, set } from 'firebase/database';
import { createContext, useCallback, useContext, useRef, useState, useEffect, useMemo } from 'react';
import { useActionItems } from '../hooks/useActionItems';
import { useBoardBackground } from '../hooks/useBoardBackground';
import { useBoardSettings } from '../hooks/useBoardSettings';
import { useColumnTimer } from '../hooks/useColumnTimer';
import { useGroups } from '../hooks/useGroups';
import { useHealthCheck, HEALTH_CHECK_QUESTIONS } from '../hooks/useHealthCheck';
import { usePoll } from '../hooks/usePoll';
import { usePresence } from '../hooks/usePresence';
import { useTimer } from '../hooks/useTimer';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useVoting } from '../hooks/useVoting';
import { useWorkflow } from '../hooks/useWorkflow';
import { database, auth, signInAnonymously, get } from '../utils/firebase';
import { generateId } from '../utils/ids';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import { useNotification } from './NotificationContext';

// Default board title constant
export const DEFAULT_BOARD_TITLE = 'Untitled Board';

// Create the context
const BoardContext = createContext();

// Custom hook for using the board context
export const useBoardContext = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within a BoardProvider');
  }
  return context;
};

// Provider component
export const BoardProvider = ({ children, initialBoardId = null }) => {
  const [user, setUser] = useState(null);
  const [boardId, setBoardId] = useState(initialBoardId);
  const [boardTitle, setBoardTitle] = useState(DEFAULT_BOARD_TITLE);
  const [columns, setColumns] = useState({});
  const [sortByVotes, setSortByVotesState] = useState(false);
  const [votingEnabled, setVotingEnabled] = useState(true); // Default to enabled
  const [downvotingEnabled, setDownvotingEnabled] = useState(true); // Default to enabled
  const [multipleVotesAllowed, setMultipleVotesAllowed] = useState(false); // Default to disallowed
  const [votesPerUser, setVotesPerUser] = useState(0); // Default to unlimited (0 = no limit)
  const [retrospectiveMode, setRetrospectiveMode] = useState(false); // Retrospective mode - default to disabled (cards are visible)
  const [showDisplayNames, setShowDisplayNames] = useState(false); // Default to off
  const [detailNavigationHintsDismissed, setDetailNavigationHintsDismissed] = useState(false);

  // New workflow phase system
  const [workflowPhase, setWorkflowPhase] = useState(WORKFLOW_PHASES.CREATION);
  const [resultsViewIndex, setResultsViewIndex] = useState(0); // For navigating results

  // Poll state for retrospective effectiveness rating
  const [pollVotes, setPollVotes] = useState({}); // { userId: rating }
  const [userPollVote, setUserPollVote] = useState(null); // Current user's vote

  // Health check state
  const [healthCheckVotes, setHealthCheckVotes] = useState({}); // { questionId: { userId: rating } }
  const [userHealthCheckVotes, setUserHealthCheckVotes] = useState({}); // { questionId: rating }

  const [boardRef, setBoardRef] = useState(null);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [hideCardAuthorship, setHideCardAuthorship] = useState(false);

  // Display name and color for user presence
  const [displayName, setDisplayName] = useState('');
  const [userColor, setUserColor] = useState('');
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  // Board owner tracking
  const [boardOwner, setBoardOwner] = useState(null);

  // Global timer state
  const [timerData, setTimerData] = useState(null);

  // Action items state
  const [actionItems, setActionItems] = useState({});
  const [actionItemsEnabled, setActionItemsEnabled] = useState(false); // Default to disabled
  const initialWorkflowPhaseRef = useRef(null); // Captures the workflowPhase on first board load
  const [initialWorkflowPhase, setInitialWorkflowPhase] = useState(null);

  // Board background state
  const [backgroundId, setBackgroundId] = useState('none');
  const [customBackgroundCss, setCustomBackgroundCss] = useState('');
  const [customBackgroundSizeState, setCustomBackgroundSizeState] = useState('cover');
  // Firebase authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUser(user);

        // Load user preferences including theme, display name, and color
        const userPrefsRef = ref(database, `users/${user.uid}/preferences`);
        get(userPrefsRef).then(snapshot => {
          if (snapshot.exists()) {
            const prefs = snapshot.val();
            if (prefs.darkMode !== undefined) {
              setDarkMode(prefs.darkMode);
            }
            if (prefs.hideCardAuthorship !== undefined) {
              setHideCardAuthorship(prefs.hideCardAuthorship);
            }
            if (prefs.displayName) {
              setDisplayName(prefs.displayName);
            }
            if (prefs.userColor) {
              setUserColor(prefs.userColor);
            }
          }
          setPrefsLoaded(true);
        }).catch(error => {
          console.error('Error loading user preferences:', error);
          setPrefsLoaded(true);
        });
      } else {
        signInAnonymously(auth)
          .catch(error => {
            console.error('Error signing in:', error);
          });
      }
    });

    return () => unsubscribe();
  }, []);

  // Update document class when dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
    }
  }, [darkMode]);

  // Set up board reference when boardId changes
  useEffect(() => {
    if (boardId && user) {
      const newBoardRef = ref(database, `boards/${boardId}`);
      setBoardRef(newBoardRef);
      // Reset initial workflow phase tracking for the new board
      initialWorkflowPhaseRef.current = null;
      setInitialWorkflowPhase(null);

      // Listen for changes to the board
      onValue(newBoardRef, snapshot => {
        const boardData = snapshot.val();
        if (boardData) {
          if (boardData.title) {
            setBoardTitle(boardData.title);
          }
          setColumns(boardData.columns || {});

          // Set board owner
          if (boardData.owner) {
            setBoardOwner(boardData.owner);
          }

          // Set voting preferences if available, otherwise use defaults
          if (boardData.settings) {
            if (boardData.settings.votingEnabled !== undefined) {
              setVotingEnabled(boardData.settings.votingEnabled);
            }
            if (boardData.settings.downvotingEnabled !== undefined) {
              setDownvotingEnabled(boardData.settings.downvotingEnabled);
            }
            if (boardData.settings.multipleVotesAllowed !== undefined) {
              setMultipleVotesAllowed(boardData.settings.multipleVotesAllowed);
            }
            if (boardData.settings.votesPerUser !== undefined) {
              setVotesPerUser(boardData.settings.votesPerUser);
            }
            if (boardData.settings.sortByVotes !== undefined) {
              setSortByVotesState(boardData.settings.sortByVotes);
            }
            if (boardData.settings.retrospectiveMode !== undefined) {
              setRetrospectiveMode(boardData.settings.retrospectiveMode);
            }
            if (boardData.settings.workflowPhase !== undefined) {
              setWorkflowPhase(boardData.settings.workflowPhase);
              // Capture initial workflow phase on first load
              if (initialWorkflowPhaseRef.current === null) {
                initialWorkflowPhaseRef.current = boardData.settings.workflowPhase;
                setInitialWorkflowPhase(boardData.settings.workflowPhase);
              }
            }
            if (boardData.settings.resultsViewIndex !== undefined) {
              setResultsViewIndex(boardData.settings.resultsViewIndex);
            }
            if (boardData.settings.showDisplayNames !== undefined) {
              setShowDisplayNames(boardData.settings.showDisplayNames);
            }
            setDetailNavigationHintsDismissed(!!boardData.settings.detailNavigationHintsDismissed);
            if (boardData.settings.actionItemsEnabled !== undefined) {
              setActionItemsEnabled(boardData.settings.actionItemsEnabled);
            }
            if (boardData.settings.backgroundId !== undefined) {
              setBackgroundId(boardData.settings.backgroundId);
            }
            if (boardData.settings.customBackgroundCss !== undefined) {
              setCustomBackgroundCss(boardData.settings.customBackgroundCss);
            }
            if (boardData.settings.customBackgroundSize !== undefined) {
              setCustomBackgroundSizeState(boardData.settings.customBackgroundSize);
            }
          } else {
            setDetailNavigationHintsDismissed(false);
          }

          // Load global timer data
          if (boardData.timer) {
            setTimerData(boardData.timer);
          } else {
            setTimerData(null);
          }


          // Load poll data
          if (boardData.poll) {
            setPollVotes(boardData.poll.votes || {});
            if (user && boardData.poll.votes && boardData.poll.votes[user.uid]) {
              setUserPollVote(boardData.poll.votes[user.uid]);
            } else {
              setUserPollVote(null);
            }
          } else {
            setPollVotes({});
            setUserPollVote(null);
          }

          // Load health check data
          if (boardData.healthCheck) {
            setHealthCheckVotes(boardData.healthCheck.votes || {});
            if (user) {
              const userVotes = {};
              Object.entries(boardData.healthCheck.votes || {}).forEach(([questionId, questionVotes]) => {
                if (questionVotes[user.uid] !== undefined) {
                  userVotes[questionId] = questionVotes[user.uid];
                }
              });
              setUserHealthCheckVotes(userVotes);
            } else {
              setUserHealthCheckVotes({});
            }
          } else {
            setHealthCheckVotes({});
            setUserHealthCheckVotes({});
          }

          // Load action items
          setActionItems(boardData.actionItems || {});
        }
      });

      return () => {
        off(newBoardRef);
      };
    }
  }, [boardId, user]);

  // Presence and card creation activity tracking
  const {
    activeUsers,
    presenceData,
    usersAddingCards,
    startCardCreation,
    stopCardCreation,
    getUsersAddingCardsInColumn,
    getAllUsersAddingCards
  } = usePresence({ boardId, user, displayName, userColor });

  // Update display name and color (persists to user prefs)
  const updateDisplayName = useCallback((newName) => {
    setDisplayName(newName);
    if (user) {
      const userPrefsRef = ref(database, `users/${user.uid}/preferences`);
      get(userPrefsRef).then(snapshot => {
        const currentPrefs = snapshot.exists() ? snapshot.val() : {};
        set(userPrefsRef, { ...currentPrefs, displayName: newName });
      }).catch(error => {
        console.error('Error saving display name:', error);
      });
    }
  }, [user]);

  const updateUserColor = useCallback((newColor) => {
    setUserColor(newColor);
    if (user) {
      const userPrefsRef = ref(database, `users/${user.uid}/preferences`);
      get(userPrefsRef).then(snapshot => {
        const currentPrefs = snapshot.exists() ? snapshot.val() : {};
        set(userPrefsRef, { ...currentPrefs, userColor: newColor });
      }).catch(error => {
        console.error('Error saving user color:', error);
      });
    }
  }, [user]);

  // Clear display name (used when removing name)
  const clearDisplayName = useCallback(() => {
    setDisplayName('');
    setUserColor('');
    if (user) {
      const userPrefsRef = ref(database, `users/${user.uid}/preferences`);
      get(userPrefsRef).then(snapshot => {
        const currentPrefs = snapshot.exists() ? snapshot.val() : {};
        const { displayName: _dn, userColor: _uc, ...rest } = currentPrefs;
        set(userPrefsRef, rest);
      }).catch(error => {
        console.error('Error clearing display name:', error);
      });
      // Also clear from presence
      if (boardId) {
        const presenceRef = ref(database, `boards/${boardId}/presence/${user.uid}`);
        set(presenceRef, {
          lastSeen: Date.now(),
          uid: user.uid,
          displayName: '',
          color: ''
        });
      }
    }
  }, [user, boardId]);

  // Notification hook (from NotificationContext, which wraps BoardProvider)
  const { showNotification } = useNotification();

  // Undo/redo system
  const {
    recordAction, undo, redo,
    canUndo, canRedo, pastCount, futureCount
  } = useUndoRedo({ boardId, showNotification });

  // Board settings hook
  const {
    updateBoardSettings,
    updateVotingEnabled,
    updateDownvotingEnabled,
    updateMultipleVotesAllowed,
    updateVotesPerUser,
    setSortByVotes,
    updateRetrospectiveMode,
    updateShowDisplayNames,
    updateActionItemsEnabled
  } = useBoardSettings({
    boardId,
    user,
    settingsState: {
      votingEnabled, downvotingEnabled, multipleVotesAllowed,
      votesPerUser, sortByVotes, retrospectiveMode,
      workflowPhase, resultsViewIndex, showDisplayNames, detailNavigationHintsDismissed, actionItemsEnabled,
      backgroundId, customBackgroundCss, customBackgroundSize: customBackgroundSizeState
    },
    setters: {
      setVotingEnabled, setDownvotingEnabled, setMultipleVotesAllowed,
      setVotesPerUser, setSortByVotesState, setRetrospectiveMode,
      setWorkflowPhase, setResultsViewIndex, setShowDisplayNames, setDetailNavigationHintsDismissed, setActionItemsEnabled,
      setBackgroundId, setCustomBackgroundCss, setCustomBackgroundSize: setCustomBackgroundSizeState
    }
  });

  // Board background hook
  const {
    setBoardBackground, setCustomBackground, setCustomBackgroundSize, clearBackground
  } = useBoardBackground({
    updateBoardSettings
  });

  // Poll and health check hooks
  const { submitPollVote, getPollStats } = usePoll({
    boardId, user, pollVotes, setUserPollVote
  });

  const { submitHealthCheckVote, getHealthCheckStats, resetHealthCheck } = useHealthCheck({
    boardId, user, healthCheckVotes, setUserHealthCheckVotes
  });

  // Voting operations
  const {
    resetAllVotes, getTotalVotes, getUserVoteCount,
    getTotalVotesRemaining, upvoteGroup, downvoteGroup
  } = useVoting({
    boardId, user, columns, activeUsers,
    votesPerUser, multipleVotesAllowed, retrospectiveMode
  });

  // Group operations
  const {
    moveCard, createCardGroup, ungroupCards,
    removeAllGrouping, updateGroupName, toggleGroupExpanded
  } = useGroups({ boardId, user, columns, recordAction });

  // Workflow phase transitions and results navigation
  const {
    startGroupingPhase, startInteractionsPhase,
    startResultsPhase, startPollPhase, startPollResultsPhase,
    goToCreationPhase, goToPreviousPhase,
    startHealthCheckPhase, startHealthCheckResultsPhase,
    navigateResults, getSortedItemsForResults
  } = useWorkflow({
    updateBoardSettings, columns, workflowPhase,
    resultsViewIndex, removeAllGrouping
  });

  // Per-column timer functions
  const {
    startColumnTimer, pauseColumnTimer, resumeColumnTimer, resetColumnTimer, restartColumnTimer, setColumnDefaultTimer
  } = useColumnTimer({
    boardId, user, workflowPhase, columns
  });

  // Global timer functions
  const {
    startTimer, pauseTimer, resumeTimer, resetTimer, restartTimer
  } = useTimer({
    boardId, user, timerData, setTimerData, workflowPhase, columns
  });
  // Action items operations
  const {
    createActionItem, updateActionItemStatus, updateActionItemAssignee,
    updateActionItemDueDate, updateActionItemDescription, deleteActionItem
  } = useActionItems({ boardId, user, columns });

  // Compute board-wide tags
  const boardTags = useMemo(() => {
    const tagsSet = new Set();
    Object.values(columns || {}).forEach(column => {
      if (column.cards) {
        Object.values(column.cards).forEach(card => {
          if (card.tags && Array.isArray(card.tags)) {
            card.tags.forEach(tag => tagsSet.add(tag));
          }
        });
      }
    });
    return Array.from(tagsSet).sort();
  }, [columns]);

  // Context value
  const value = useMemo(() => {
    // Create a new board with specified template columns, title, and optional settings overrides
    const createNewBoard = (templateColumns = null, newBoardTitle = DEFAULT_BOARD_TITLE, settingsOverride = null) => {
      if (!user) {
        return null;
      }

      const newBoardId = generateId();
      const newBoardRef = ref(database, `boards/${newBoardId}`);

      // Default columns if no template specified
      const columnsToCreate = templateColumns || ['To Do', 'In Progress', 'Done'];

      // Build columns object with ordered prefixes
      const columnsObj = {};

      // Using alphabet prefixes to ensure correct ordering
      const alphabet = 'abcdefghijklmnopqrstuvwxyz';

      columnsToCreate.forEach((columnTitle, index) => {
        // Use alphabet prefixes up to 26 columns, then fallback to numeric prefixes
        const prefix = index < 26 ? alphabet[index] : `col${index}`;
        columnsObj[`${prefix}_${generateId()}`] = {
          title: columnTitle,
          cards: {}
        };
      });

      // Only allow a safe subset of settings to be overridden on creation
      const allowedOverrideKeys = ['votingEnabled', 'downvotingEnabled', 'multipleVotesAllowed', 'votesPerUser', 'retrospectiveMode', 'sortByVotes', 'showDisplayNames'];
      const sanitizedOverrides = {};
      if (settingsOverride && typeof settingsOverride === 'object') {
        allowedOverrideKeys.forEach(k => {
          if (settingsOverride[k] !== undefined) {
            sanitizedOverrides[k] = settingsOverride[k];
          }
        });
      }

      const initialData = {
        title: newBoardTitle,
        created: Date.now(),
        owner: user.uid,
        columns: columnsObj,
        settings: {
          votingEnabled: true, // Default to enabled for new boards
          downvotingEnabled: true, // Default to enabled for new boards
          multipleVotesAllowed: false, // Default to not allowing multiple votes
          sortByVotes: false, // Default to chronological
          retrospectiveMode: false, // Default to disabled (cards are visible)
          workflowPhase: WORKFLOW_PHASES.CREATION, // Default to creation phase
          resultsViewIndex: 0, // Default to first result
          showDisplayNames: false, // Default to off
          detailNavigationHintsDismissed: false,
          // Apply any overrides parsed from URL (validated/whitelisted)
          ...sanitizedOverrides
        }
      };

      set(newBoardRef, initialData)
        .then(() => {
          setBoardId(newBoardId);
          setBoardTitle(DEFAULT_BOARD_TITLE);
        })
        .catch(error => {
          console.error('Error creating board:', error);
        });

      return newBoardId;
    };

    // Open an existing board
    const openExistingBoard = boardIdToOpen => {
      setBoardId(boardIdToOpen);
    };

    // Update board title
    const updateBoardTitle = newTitle => {
      // Optimistically update the local state first for better UI responsiveness
      setBoardTitle(newTitle);

      if (boardId && user) {
        const titleRef = ref(database, `boards/${boardId}/title`);
        set(titleRef, newTitle)
          .catch(error => {
            console.error('Error updating board title:', error);
          });
      }
    };

    // Update dark mode preference
    const updateDarkMode = enabled => {
      if (user) {
        const userPrefsRef = ref(database, `users/${user.uid}/preferences`);
        get(userPrefsRef).then(snapshot => {
          const currentPrefs = snapshot.exists() ? snapshot.val() : {};
          set(userPrefsRef, { ...currentPrefs, darkMode: enabled })
            .then(() => {
              setDarkMode(enabled);
            })
            .catch(error => {
              console.error('Error updating dark mode preference:', error);
            });
        }).catch(error => {
          console.error('Error reading preferences:', error);
        });
      } else {
        setDarkMode(enabled);
      }
    };

    // Update hide card authorship preference
    const updateHideCardAuthorship = enabled => {
      if (user) {
        const userPrefsRef = ref(database, `users/${user.uid}/preferences`);
        get(userPrefsRef).then(snapshot => {
          const currentPrefs = snapshot.exists() ? snapshot.val() : {};
          set(userPrefsRef, { ...currentPrefs, hideCardAuthorship: enabled })
            .then(() => {
              setHideCardAuthorship(enabled);
            })
            .catch(error => {
              console.error('Error updating hide card authorship preference:', error);
            });
        }).catch(error => {
          console.error('Error reading preferences:', error);
        });
      } else {
        setHideCardAuthorship(enabled);
      }
    };

    return {
    user, boardId, setBoardId, boardTitle, setBoardTitle, columns,
    updateBoardTitle, sortByVotes, setSortByVotes, votingEnabled,
    setVotingEnabled, updateVotingEnabled, downvotingEnabled,
    setDownvotingEnabled, updateDownvotingEnabled, multipleVotesAllowed,
    setMultipleVotesAllowed, updateMultipleVotesAllowed, votesPerUser,
    setVotesPerUser, updateVotesPerUser, retrospectiveMode,
    setRetrospectiveMode, updateRetrospectiveMode, updateBoardSettings,
    showDisplayNames, updateShowDisplayNames, detailNavigationHintsDismissed,
    boardRef, createNewBoard, openExistingBoard, moveCard, resetAllVotes,
    getTotalVotes, getUserVoteCount, getTotalVotesRemaining, darkMode,
      updateDarkMode,
      // Tags
      boardTags,
      // Screen sharing mode
      hideCardAuthorship,
      updateHideCardAuthorship,
      // Display name and presence
      displayName,
      userColor,
      updateDisplayName,
      updateUserColor,
      clearDisplayName,
      prefsLoaded,
      activeUsers,
      presenceData,
      // Workflow phase system
      workflowPhase,
      setWorkflowPhase,
    resultsViewIndex, setResultsViewIndex, startGroupingPhase,
    startInteractionsPhase, startResultsPhase,
    startPollPhase, startPollResultsPhase, goToCreationPhase,
    goToPreviousPhase, navigateResults, getSortedItemsForResults,
      // Poll system
    pollVotes, userPollVote, submitPollVote, getPollStats,
      // Health check system
    healthCheckVotes, userHealthCheckVotes, submitHealthCheckVote,
    getHealthCheckStats, startHealthCheckPhase, startHealthCheckResultsPhase, resetHealthCheck,
      HEALTH_CHECK_QUESTIONS,
      // Card grouping functions
    createCardGroup, ungroupCards, removeAllGrouping, updateGroupName,
      toggleGroupExpanded,
      upvoteGroup,
      downvoteGroup,
      // Card creation activity tracking
      usersAddingCards,
    startCardCreation, stopCardCreation, getUsersAddingCardsInColumn,
      getAllUsersAddingCards,
      // Per-column timer system
      startColumnTimer,
      pauseColumnTimer,
      resumeColumnTimer,
      resetColumnTimer,
      restartColumnTimer,
      setColumnDefaultTimer,
      // Global timer system
      timerData,
      startTimer,
      pauseTimer,
      resumeTimer,
      resetTimer,
      restartTimer,
      // Board ownership
      boardOwner,
      isOwner: user && boardOwner ? user.uid === boardOwner : false,
      // Undo/redo system
      recordAction,
      undo,
      redo,
    canUndo, canRedo, pastCount, futureCount,
      // Health check
      initialWorkflowPhase,
      // Action items
      actionItems, actionItemsEnabled, updateActionItemsEnabled,
      createActionItem, updateActionItemStatus, updateActionItemAssignee,
      updateActionItemDueDate, updateActionItemDescription, deleteActionItem,
      // Board background
      backgroundId, customBackgroundCss, customBackgroundSize: customBackgroundSizeState,
      setBoardBackground, setCustomBackground, setCustomBackgroundSize, clearBackground
  };
  }, [
    user, boardId, setBoardId, boardTitle, setBoardTitle, columns,
    sortByVotes, setSortByVotes, votingEnabled,
    setVotingEnabled, updateVotingEnabled, downvotingEnabled,
    setDownvotingEnabled, updateDownvotingEnabled, multipleVotesAllowed,
    setMultipleVotesAllowed, updateMultipleVotesAllowed, votesPerUser,
    setVotesPerUser, updateVotesPerUser, retrospectiveMode,
    setRetrospectiveMode, updateRetrospectiveMode, updateBoardSettings,
    showDisplayNames, updateShowDisplayNames, detailNavigationHintsDismissed,
    boardRef, moveCard, resetAllVotes,
    getTotalVotes, getUserVoteCount, getTotalVotesRemaining, darkMode, boardTags,
    hideCardAuthorship,
    displayName, userColor, updateDisplayName, updateUserColor, clearDisplayName,
    prefsLoaded,
    activeUsers, presenceData, workflowPhase, setWorkflowPhase,
    resultsViewIndex, setResultsViewIndex, startGroupingPhase,
    startInteractionsPhase, startResultsPhase,
    startPollPhase, startPollResultsPhase, goToCreationPhase,
    goToPreviousPhase, navigateResults, getSortedItemsForResults,
    pollVotes, userPollVote, submitPollVote, getPollStats,
    healthCheckVotes, userHealthCheckVotes, submitHealthCheckVote,
    getHealthCheckStats, startHealthCheckPhase, startHealthCheckResultsPhase, resetHealthCheck,
    createCardGroup, ungroupCards, removeAllGrouping, updateGroupName,
    toggleGroupExpanded, upvoteGroup, downvoteGroup, usersAddingCards,
    startCardCreation, stopCardCreation, getUsersAddingCardsInColumn,
    getAllUsersAddingCards, startColumnTimer, pauseColumnTimer, resumeColumnTimer,
    resetColumnTimer, restartColumnTimer, setColumnDefaultTimer, timerData, startTimer, pauseTimer, resumeTimer, resetTimer, restartTimer, boardOwner, recordAction, undo, redo,
    canUndo, canRedo, pastCount, futureCount,
    initialWorkflowPhase,
    actionItems, actionItemsEnabled, updateActionItemsEnabled, createActionItem,
    updateActionItemStatus, updateActionItemAssignee, updateActionItemDueDate,
    updateActionItemDescription, deleteActionItem,
    backgroundId, customBackgroundCss, customBackgroundSizeState, setBoardBackground, setCustomBackground, setCustomBackgroundSize, clearBackground
  ]);
  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export default BoardContext;
