import { ref, onValue, off, set, remove } from 'firebase/database';
import { createContext, useContext, useState, useEffect } from 'react';
import { useBoardSettings } from '../hooks/useBoardSettings';
import { useGroups } from '../hooks/useGroups';
import { useHealthCheck, HEALTH_CHECK_QUESTIONS } from '../hooks/useHealthCheck';
import { usePoll } from '../hooks/usePoll';
import { usePresence } from '../hooks/usePresence';
import { useVoting } from '../hooks/useVoting';
import { useWorkflow } from '../hooks/useWorkflow';
import { database, auth, signInAnonymously, get } from '../utils/firebase';
import { generateId } from '../utils/ids';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';

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
export const BoardProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [boardId, setBoardId] = useState(null);
  const [boardTitle, setBoardTitle] = useState(DEFAULT_BOARD_TITLE);
  const [columns, setColumns] = useState({});
  const [sortByVotes, setSortByVotesState] = useState(false);
  const [votingEnabled, setVotingEnabled] = useState(true); // Default to enabled
  const [downvotingEnabled, setDownvotingEnabled] = useState(true); // Default to enabled
  const [multipleVotesAllowed, setMultipleVotesAllowed] = useState(false); // Default to disallowed
  const [votesPerUser, setVotesPerUser] = useState(3); // Default to 3 votes per user
  const [retrospectiveMode, setRetrospectiveMode] = useState(false); // Retrospective mode - default to disabled (cards are visible)

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

  // Board owner tracking
  const [boardOwner, setBoardOwner] = useState(null);

  // Timer state for retrospective phases
  const [timerData, setTimerData] = useState(null);

  // Firebase authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUser(user);

        // Load user preferences including theme
        const userPrefsRef = ref(database, `users/${user.uid}/preferences`);
        get(userPrefsRef).then(snapshot => {
          if (snapshot.exists()) {
            const prefs = snapshot.val();
            if (prefs.darkMode !== undefined) {
              setDarkMode(prefs.darkMode);
            }
          }
        }).catch(error => {
          console.error('Error loading user preferences:', error);
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

          // Load timer data
          setTimerData(boardData.timer || null);

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
            }
            if (boardData.settings.resultsViewIndex !== undefined) {
              setResultsViewIndex(boardData.settings.resultsViewIndex);
            }
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
    usersAddingCards,
    startCardCreation,
    stopCardCreation,
    getUsersAddingCardsInColumn,
    getAllUsersAddingCards
  } = usePresence({ boardId, user });

  // Create a new board with specified template columns, title, and optional settings overrides
  const createNewBoard = (templateColumns = null, boardTitle = DEFAULT_BOARD_TITLE, settingsOverride = null) => {
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
  const allowedOverrideKeys = ['votingEnabled', 'downvotingEnabled', 'multipleVotesAllowed', 'votesPerUser', 'retrospectiveMode', 'sortByVotes'];
    const sanitizedOverrides = {};
    if (settingsOverride && typeof settingsOverride === 'object') {
      allowedOverrideKeys.forEach(k => {
        if (settingsOverride[k] !== undefined) {
          sanitizedOverrides[k] = settingsOverride[k];
        }
      });
    }

    const initialData = {
      title: boardTitle,
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

  // Board settings hook
  const {
    updateBoardSettings,
    updateVotingEnabled,
    updateDownvotingEnabled,
    updateMultipleVotesAllowed,
    updateVotesPerUser,
    setSortByVotes,
    updateRetrospectiveMode
  } = useBoardSettings({
    boardId,
    user,
    settingsState: {
      votingEnabled, downvotingEnabled, multipleVotesAllowed,
      votesPerUser, sortByVotes, retrospectiveMode,
      workflowPhase, resultsViewIndex
    },
    setters: {
      setVotingEnabled, setDownvotingEnabled, setMultipleVotesAllowed,
      setVotesPerUser, setSortByVotesState, setRetrospectiveMode,
      setWorkflowPhase, setResultsViewIndex
    }
  });

  // Poll and health check hooks
  const { submitPollVote, getPollStats } = usePoll({
    boardId, user, pollVotes, setUserPollVote
  });

  const { submitHealthCheckVote, getHealthCheckStats } = useHealthCheck({
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
  } = useGroups({ boardId, user, columns });

  // Workflow phase transitions and results navigation
  const {
    startGroupingPhase, startInteractionsPhase, startInteractionRevealPhase,
    startResultsPhase, startPollPhase, startPollResultsPhase,
    goToCreationPhase, goToPreviousPhase,
    startHealthCheckPhase, startHealthCheckResultsPhase,
    navigateResults, getSortedItemsForResults
  } = useWorkflow({
    updateBoardSettings, columns, workflowPhase,
    resultsViewIndex, removeAllGrouping
  });

  // Timer functions
  const startTimer = (duration) => {
    if (!boardId || !user) return;
    const timerRef = ref(database, `boards/${boardId}/timer`);
    const timerObj = {
      duration, // total seconds
      startedAt: Date.now(),
      isRunning: true,
      pausedRemaining: null,
      phase: workflowPhase
    };
    set(timerRef, timerObj)
      .then(() => {
        setTimerData(timerObj);
      })
      .catch(error => {
        console.error('Error starting timer:', error);
      });
  };

  const pauseTimer = () => {
    if (!boardId || !user || !timerData) return;
    const timerRef = ref(database, `boards/${boardId}/timer`);
    const elapsed = (Date.now() - timerData.startedAt) / 1000;
    const remaining = Math.max(0, timerData.duration - elapsed);
    const updatedTimer = {
      ...timerData,
      isRunning: false,
      pausedRemaining: remaining,
      startedAt: null
    };
    set(timerRef, updatedTimer)
      .then(() => {
        setTimerData(updatedTimer);
      })
      .catch(error => {
        console.error('Error pausing timer:', error);
      });
  };

  const resumeTimer = () => {
    if (!boardId || !user || !timerData || !timerData.pausedRemaining) return;
    const timerRef = ref(database, `boards/${boardId}/timer`);
    const updatedTimer = {
      ...timerData,
      duration: timerData.pausedRemaining,
      startedAt: Date.now(),
      isRunning: true,
      pausedRemaining: null
    };
    set(timerRef, updatedTimer)
      .then(() => {
        setTimerData(updatedTimer);
      })
      .catch(error => {
        console.error('Error resuming timer:', error);
      });
  };

  const resetTimer = () => {
    if (!boardId || !user) return;
    const timerRef = ref(database, `boards/${boardId}/timer`);
    remove(timerRef)
      .then(() => {
        setTimerData(null);
      })
      .catch(error => {
        console.error('Error resetting timer:', error);
      });
  };

  const restartTimer = () => {
    if (!boardId || !user || !timerData) return;
    const timerRef = ref(database, `boards/${boardId}/timer`);
    const timerObj = {
      duration: timerData.duration,
      startedAt: Date.now(),
      isRunning: true,
      pausedRemaining: null,
      phase: workflowPhase
    };
    set(timerRef, timerObj)
      .then(() => {
        setTimerData(timerObj);
      })
      .catch(error => {
        console.error('Error restarting timer:', error);
      });
  };

  // Update dark mode preference
  const updateDarkMode = enabled => {
    if (user) {
      const userPrefsRef = ref(database, `users/${user.uid}/preferences`);
      set(userPrefsRef, { darkMode: enabled })
        .then(() => {
          setDarkMode(enabled);
        })
        .catch(error => {
          console.error('Error updating dark mode preference:', error);
        });
    } else {
      // If we're not connected to a user yet, just update the local state
      setDarkMode(enabled);
    }
  };

  // Context value
  const value = {
    user,
    boardId,
    setBoardId,
    boardTitle,
    setBoardTitle,
    columns,
    updateBoardTitle,
    sortByVotes,
    setSortByVotes,
    votingEnabled,
    setVotingEnabled,
    updateVotingEnabled,
    downvotingEnabled,
    setDownvotingEnabled,
    updateDownvotingEnabled,
    multipleVotesAllowed,
    setMultipleVotesAllowed,
    updateMultipleVotesAllowed,
    votesPerUser,
    setVotesPerUser,
    updateVotesPerUser,
    retrospectiveMode,
    setRetrospectiveMode,
    updateRetrospectiveMode,
    updateBoardSettings,
    boardRef,
    createNewBoard,
    openExistingBoard,
    moveCard,
    resetAllVotes,
    getTotalVotes,
    getUserVoteCount,
    getTotalVotesRemaining,
    darkMode,
    updateDarkMode,
    activeUsers,
    // Workflow phase system
    workflowPhase,
    setWorkflowPhase,
    resultsViewIndex,
    setResultsViewIndex,
    startGroupingPhase,
    startInteractionsPhase,
    startInteractionRevealPhase,
    startResultsPhase,
    startPollPhase,
    startPollResultsPhase,
    goToCreationPhase,
    goToPreviousPhase,
    navigateResults,
    getSortedItemsForResults,
    // Poll system
    pollVotes,
    userPollVote,
    submitPollVote,
    getPollStats,
    // Health check system
    healthCheckVotes,
    userHealthCheckVotes,
    submitHealthCheckVote,
    getHealthCheckStats,
    startHealthCheckPhase,
    startHealthCheckResultsPhase,
    HEALTH_CHECK_QUESTIONS,
    // Card grouping functions
    createCardGroup,
    ungroupCards,
    removeAllGrouping,
    updateGroupName,
    toggleGroupExpanded,
    upvoteGroup,
    downvoteGroup,
    // Card creation activity tracking
    usersAddingCards,
    startCardCreation,
    stopCardCreation,
    getUsersAddingCardsInColumn,
    getAllUsersAddingCards,
    // Timer system
    timerData,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    restartTimer,
    // Board ownership
    boardOwner,
    isOwner: user && boardOwner ? user.uid === boardOwner : false
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export default BoardContext;
