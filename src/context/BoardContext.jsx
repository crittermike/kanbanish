import { ref, onValue, off, set, remove } from 'firebase/database';
import { createContext, useContext, useState, useEffect } from 'react';
import { database, auth, signInAnonymously, get } from '../utils/firebase';
import { generateId } from '../utils/helpers';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';

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
  const [boardTitle, setBoardTitle] = useState('Untitled Board');
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

  const [boardRef, setBoardRef] = useState(null);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [activeUsers, setActiveUsers] = useState(0); // Track number of active users
  const [usersAddingCards, setUsersAddingCards] = useState({}); // Track users currently adding cards

  // Firebase authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        console.log('User authenticated:', user.uid);
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
        console.log('No user, signing in anonymously');
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
        }
      });

      return () => {
        off(newBoardRef);
      };
    }
  }, [boardId, user]);

  // Track user presence on the board
  useEffect(() => {
    if (boardId && user) {
      const presenceRef = ref(database, `boards/${boardId}/presence/${user.uid}`);
      const presenceCountRef = ref(database, `boards/${boardId}/presence`);

      // Set this user as active
      set(presenceRef, {
        lastSeen: Date.now(),
        uid: user.uid
      });

      // Listen to all active users
      const handlePresenceChange = snapshot => {
        if (snapshot.exists()) {
          const presenceData = snapshot.val();
          const now = Date.now();
          const activeThreshold = 30000; // Consider users active if seen within last 30 seconds

          // Count users who were active recently
          const activeUserCount = Object.values(presenceData).filter(userData =>
            userData.lastSeen && (now - userData.lastSeen < activeThreshold)
          ).length;

          setActiveUsers(activeUserCount);
        } else {
          setActiveUsers(0);
        }
      };

      onValue(presenceCountRef, handlePresenceChange);

      // Update presence every 10 seconds while user is active
      const presenceInterval = setInterval(() => {
        set(presenceRef, {
          lastSeen: Date.now(),
          uid: user.uid
        });
      }, 10000);

      // Clean up when user leaves
      return () => {
        off(presenceCountRef, handlePresenceChange);
        clearInterval(presenceInterval);
        // Remove user from presence when they leave
        remove(presenceRef);
        // Also remove any card creation activity
        if (user?.uid) {
          const cardCreationRef = ref(database, `boards/${boardId}/cardCreationActivity/${user.uid}`);
          remove(cardCreationRef);
        }
      };
    }
  }, [boardId, user]);

  // Track users adding cards
  useEffect(() => {
    if (boardId && user) {
      const cardCreationRef = ref(database, `boards/${boardId}/cardCreationActivity`);

      // Listen for changes to card creation activity
      const handleCardCreationChange = snapshot => {
        if (snapshot.exists()) {
          const activityData = snapshot.val();
          // Show all active card creation activity without time-based filtering
          setUsersAddingCards(activityData);
        } else {
          setUsersAddingCards({});
        }
      };

      onValue(cardCreationRef, handleCardCreationChange);

      return () => {
        off(cardCreationRef, handleCardCreationChange);
      };
    }
  }, [boardId, user]);

  // Cleanup card creation activity on page unload
  useEffect(() => {
    if (boardId && user) {
      const handleBeforeUnload = () => {
        // Remove card creation activity when user leaves the page
        const cardCreationRef = ref(database, `boards/${boardId}/cardCreationActivity/${user.uid}`);
        remove(cardCreationRef);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [boardId, user]);

  // Create a new board with specified template columns, title, and optional settings overrides
  const createNewBoard = (templateColumns = null, boardTitle = 'Untitled Board', settingsOverride = null) => {
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
        console.log('New board created with ID:', newBoardId);
        setBoardId(newBoardId);
        setBoardTitle('Untitled Board');
      })
      .catch(error => {
        console.error('Error creating board:', error);
      });

    return newBoardId;
  };

  // Open an existing board
  const openExistingBoard = boardIdToOpen => {
    console.log('Opening board with ID:', boardIdToOpen);
    setBoardId(boardIdToOpen);
  };

  // Update board title
  const updateBoardTitle = newTitle => {
    // Optimistically update the local state first for better UI responsiveness
    setBoardTitle(newTitle);

    if (boardId && user) {
      const titleRef = ref(database, `boards/${boardId}/title`);
      set(titleRef, newTitle)
        .then(() => {
          console.log('Board title updated');
        })
        .catch(error => {
          console.error('Error updating board title:', error);
        });
    }
  };

  // Update board settings with merged values
  const updateBoardSettings = newSettings => {
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
        ...newSettings
      };

      set(settingsRef, updatedSettings)
        .then(() => {
          console.log('Board settings updated:', updatedSettings);
          // Update local state based on newSettings
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
        })
        .catch(error => {
          console.error('Error updating board settings:', error);
        });
    } else {
      // If we're not connected to a board yet, just update the local state
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
    }
  };

  // Update voting enabled setting
  const updateVotingEnabled = enabled => {
    updateBoardSettings({ votingEnabled: enabled });
  };

  // Update downvoting enabled setting
  const updateDownvotingEnabled = enabled => {
    updateBoardSettings({ downvotingEnabled: enabled });
  };

  // Update multiple votes allowed setting
  const updateMultipleVotesAllowed = allowed => {
    updateBoardSettings({ multipleVotesAllowed: allowed });
  };

  // Update votes per user setting
  const updateVotesPerUser = limit => {
    updateBoardSettings({ votesPerUser: limit });
  };

  // Set sort by votes setting (persists to Firebase)
  const setSortByVotes = enabled => {
    updateBoardSettings({ sortByVotes: enabled });
  };

  // Update reveal mode setting
  const updateRetrospectiveMode = enabled => {
    if (enabled) {
      // When enabling reveal mode, just update that setting
      updateBoardSettings({ retrospectiveMode: enabled });
    } else {
      // When disabling reveal mode, also reset workflow to creation phase
      updateBoardSettings({
        retrospectiveMode: enabled,
        workflowPhase: WORKFLOW_PHASES.CREATION,
        resultsViewIndex: 0
      });
    }
  };

  // Workflow phase transition functions
  const startGroupingPhase = () => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.GROUPING,
      retrospectiveMode: true
    });
  };

  const startInteractionsPhase = () => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.INTERACTIONS
    });
  };

  const startInteractionRevealPhase = () => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.INTERACTION_REVEAL
    });
  };

  const startResultsPhase = () => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.RESULTS,
      resultsViewIndex: 0
    });
  };

  const startPollPhase = () => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.POLL
    });
  };

  const startPollResultsPhase = () => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.POLL_RESULTS
    });
  };

  const goToCreationPhase = () => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.CREATION,
      retrospectiveMode: false,
      resultsViewIndex: 0
    });
  };

  // Poll functionality for retrospective effectiveness rating
  const submitPollVote = rating => {
    if (!boardId || !user || rating < 1 || rating > 5) {
      return;
    }

    const pollRef = ref(database, `boards/${boardId}/poll/votes/${user.uid}`);
    set(pollRef, rating).then(() => {
      setUserPollVote(rating);
    }).catch(error => {
      console.error('Error submitting poll vote:', error);
    });
  };

  const getPollStats = () => {
    const votes = Object.values(pollVotes);
    if (votes.length === 0) {
      return { average: 0, distribution: [0, 0, 0, 0, 0], totalVotes: 0 };
    }

    const distribution = [0, 0, 0, 0, 0]; // Index 0 = rating 1, Index 4 = rating 5
    let sum = 0;

    votes.forEach(vote => {
      if (vote >= 1 && vote <= 5) {
        distribution[vote - 1]++;
        sum += vote;
      }
    });

    const average = sum / votes.length;
    return { average, distribution, totalVotes: votes.length };
  };

  // Remove all grouping from the board
  const removeAllGrouping = () => {
    if (!boardId || !user) {
      return Promise.resolve();
    }

    const promises = [];

    // Loop through all columns and ungroup all groups
    Object.entries(columns).forEach(([columnId, column]) => {
      if (column.groups) {
        Object.entries(column.groups).forEach(([groupId, group]) => {
          if (group.cardIds) {
            // Clear groupId from each card in the group
            group.cardIds.forEach(cardId => {
              const cardRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/groupId`);
              promises.push(remove(cardRef));
            });
          }

          // Remove the group itself
          const groupRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}`);
          promises.push(remove(groupRef));
        });
      }
    });

    return Promise.all(promises)
      .then(() => {
        console.log('All grouping removed from board');
      })
      .catch(error => {
        console.error('Error removing all grouping:', error);
        throw error;
      });
  };

  const goToPreviousPhase = () => {
    switch (workflowPhase) {
      case WORKFLOW_PHASES.GROUPING: {
        // When going back to CREATION from GROUPING, warn about losing group data
        const hasGroups = Object.values(columns).some(column =>
          column.groups && Object.keys(column.groups).length > 0
        );

        if (hasGroups) {
          const confirmMessage = 'Going back to the creation phase will remove all card grouping. This cannot be undone. Are you sure you want to continue?';
          if (!window.confirm(confirmMessage)) {
            return; // User cancelled
          }

          // Remove all grouping before transitioning
          removeAllGrouping()
            .then(() => {
              updateBoardSettings({
                workflowPhase: WORKFLOW_PHASES.CREATION
              });
            })
            .catch(error => {
              console.error('Failed to remove grouping:', error);
            });
        } else {
          // No groups to remove, just transition
          updateBoardSettings({
            workflowPhase: WORKFLOW_PHASES.CREATION
          });
        }
        break;
      }
      case WORKFLOW_PHASES.INTERACTIONS:
        updateBoardSettings({
          workflowPhase: WORKFLOW_PHASES.GROUPING
        });
        break;
      case WORKFLOW_PHASES.INTERACTION_REVEAL:
        updateBoardSettings({
          workflowPhase: WORKFLOW_PHASES.INTERACTIONS
        });
        break;
      case WORKFLOW_PHASES.RESULTS:
        updateBoardSettings({
          workflowPhase: WORKFLOW_PHASES.INTERACTION_REVEAL
        });
        break;
      case WORKFLOW_PHASES.POLL:
        updateBoardSettings({
          workflowPhase: WORKFLOW_PHASES.RESULTS
        });
        break;
      case WORKFLOW_PHASES.POLL_RESULTS:
        updateBoardSettings({
          workflowPhase: WORKFLOW_PHASES.POLL
        });
        break;
      default:
        // If we're in CREATION or any unknown phase, do nothing
        break;
    }
  };

  // Results navigation functions
  const navigateResults = direction => {
    if (workflowPhase !== WORKFLOW_PHASES.RESULTS) {
      return;
    }

    const sortedItems = getSortedItemsForResults();
    const maxIndex = sortedItems.length - 1;

    let newIndex = resultsViewIndex;
    if (direction === 'next' && resultsViewIndex < maxIndex) {
      newIndex = resultsViewIndex + 1;
    } else if (direction === 'prev' && resultsViewIndex > 0) {
      newIndex = resultsViewIndex - 1;
    }

    updateBoardSettings({ resultsViewIndex: newIndex });
  };

  // Get sorted items (cards and groups) for results view
  const getSortedItemsForResults = () => {
    const allItems = [];

    Object.keys(columns).forEach(columnId => {
      const columnData = columns[columnId];

      // Add individual cards (not in groups)
      Object.keys(columnData.cards || {}).forEach(cardId => {
        const card = columnData.cards[cardId];
        if (!card.groupId) {
          allItems.push({
            type: 'card',
            id: cardId,
            columnId,
            data: card,
            votes: card.votes || 0
          });
        }
      });

      // Add groups
      Object.keys(columnData.groups || {}).forEach(groupId => {
        const group = columnData.groups[groupId];
        allItems.push({
          type: 'group',
          id: groupId,
          columnId,
          data: group,
          votes: group.votes || 0
        });
      });
    });

    // Sort by votes (descending)
    return allItems.sort((a, b) => b.votes - a.votes);
  };

  // Reset all votes in the board
  const resetAllVotes = () => {
    if (!boardId || !user) {
      return false;
    }

    // Confirm before proceeding
    const confirmMessage = 'Are you sure you want to reset all votes to zero? This cannot be undone.';
    if (!window.confirm(confirmMessage)) {
      return false;
    }

    // Loop through all columns and cards
    Object.entries(columns).forEach(([columnId, column]) => {
      if (column.cards) {
        Object.entries(column.cards).forEach(([cardId, card]) => {
          // Reset votes to 0 and clear all voters
          const cardRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}`);
          const updatedCard = { ...card, votes: 0, voters: {} };
          set(cardRef, updatedCard)
            .catch(error => {
              console.error(`Error resetting votes for card ${cardId}:`, error);
            });
        });
      }

      // Also reset group votes
      if (column.groups) {
        Object.entries(column.groups).forEach(([groupId, group]) => {
          // Reset group votes to 0 and clear all voters
          const groupRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}`);
          const updatedGroup = { ...group, votes: 0, voters: {} };
          set(groupRef, updatedGroup)
            .catch(error => {
              console.error(`Error resetting votes for group ${groupId}:`, error);
            });
        });
      }
    });

    return true;
  };

  // Calculate total votes across all cards and groups
  const getTotalVotes = () => {
    let totalVotes = 0;

    Object.values(columns).forEach(column => {
      // Sum votes from all cards
      if (column.cards) {
        Object.values(column.cards).forEach(card => {
          totalVotes += card.votes || 0;
        });
      }

      // Sum votes from all groups
      if (column.groups) {
        Object.values(column.groups).forEach(group => {
          totalVotes += group.votes || 0;
        });
      }
    });

    return totalVotes;
  };

  // Calculate total votes cast by a specific user across all cards and groups
  const getUserVoteCount = (userId) => {
    if (!userId) return 0;
    
    let userVotes = 0;

    Object.values(columns).forEach(column => {
      // Count votes from all cards
      if (column.cards) {
        Object.values(column.cards).forEach(card => {
          if (card.voters && card.voters[userId]) {
            userVotes += Math.abs(card.voters[userId]); // Use absolute value to count both upvotes and downvotes
          }
        });
      }

      // Count votes from all groups
      if (column.groups) {
        Object.values(column.groups).forEach(group => {
          if (group.voters && group.voters[userId]) {
            userVotes += Math.abs(group.voters[userId]); // Use absolute value to count both upvotes and downvotes
          }
        });
      }
    });

    return userVotes;
  };

  // Calculate total votes remaining across all active users
  const getTotalVotesRemaining = () => {
    if (!activeUsers || activeUsers === 0) return 0;
    
    const totalPossibleVotes = activeUsers * votesPerUser;
    const totalVotesCast = getTotalVotes();
    
    return Math.max(0, totalPossibleVotes - totalVotesCast);
  };

  // Move a card between columns or into/out of groups
  const moveCard = (cardId, sourceColumnId, targetColumnId, targetGroupId = null) => {
    if (!boardId || !user) {
      return;
    }

    // Get card data from source column (cards always live in column now)
    const cardData = columns[sourceColumnId]?.cards?.[cardId];
    if (!cardData) {
      console.error('Card not found');
      return;
    }

    const promises = [];

    // Handle moving within the same column (grouping/ungrouping)
    if (sourceColumnId === targetColumnId) {
      const currentGroupId = cardData.groupId;

      // If moving to the same group state, do nothing
      if (currentGroupId === targetGroupId) {
        return;
      }

      // Update the card's groupId
      const cardGroupRef = ref(database, `boards/${boardId}/columns/${sourceColumnId}/cards/${cardId}/groupId`);

      if (targetGroupId) {
        // Adding to a group
        promises.push(set(cardGroupRef, targetGroupId));

        // Add card ID to the target group's cardIds array (only if not already there)
        const targetGroup = columns[targetColumnId]?.groups?.[targetGroupId];
        if (targetGroup) {
          const currentCardIds = targetGroup.cardIds || [];
          if (!currentCardIds.includes(cardId)) {
            const newCardIds = [...currentCardIds, cardId];
            const groupCardIdsRef = ref(database, `boards/${boardId}/columns/${targetColumnId}/groups/${targetGroupId}/cardIds`);
            promises.push(set(groupCardIdsRef, newCardIds));
          }
        }
      } else {
        // Removing from group
        promises.push(remove(cardGroupRef));
      }

      // Remove card ID from source group if it was in one
      if (currentGroupId) {
        const sourceGroup = columns[sourceColumnId]?.groups?.[currentGroupId];
        if (sourceGroup && sourceGroup.cardIds && sourceGroup.cardIds.includes(cardId)) {
          const newCardIds = sourceGroup.cardIds.filter(id => id !== cardId);
          const groupCardIdsRef = ref(database, `boards/${boardId}/columns/${sourceColumnId}/groups/${currentGroupId}/cardIds`);
          promises.push(set(groupCardIdsRef, newCardIds));
        }
      }
    } else {
      // Moving between different columns
      const sourceCardRef = ref(database, `boards/${boardId}/columns/${sourceColumnId}/cards/${cardId}`);
      const targetCardRef = ref(database, `boards/${boardId}/columns/${targetColumnId}/cards/${cardId}`);

      // Create new card data, setting groupId if moving into a group
      const { groupId: _groupId, ...cardDataWithoutGroup } = cardData;
      const newCardData = targetGroupId
        ? { ...cardDataWithoutGroup, groupId: targetGroupId }
        : cardDataWithoutGroup;

      promises.push(remove(sourceCardRef));
      promises.push(set(targetCardRef, newCardData));

      // Add card to target group if specified
      if (targetGroupId) {
        const targetGroup = columns[targetColumnId]?.groups?.[targetGroupId];
        if (targetGroup) {
          const currentCardIds = targetGroup.cardIds || [];
          if (!currentCardIds.includes(cardId)) {
            const newCardIds = [...currentCardIds, cardId];
            const groupCardIdsRef = ref(database, `boards/${boardId}/columns/${targetColumnId}/groups/${targetGroupId}/cardIds`);
            promises.push(set(groupCardIdsRef, newCardIds));
          }
        }
      }

      // Remove card from source group if it was in one
      if (cardData.groupId) {
        const sourceGroup = columns[sourceColumnId]?.groups?.[cardData.groupId];
        if (sourceGroup && sourceGroup.cardIds) {
          const newCardIds = sourceGroup.cardIds.filter(id => id !== cardId);
          const groupCardIdsRef = ref(database, `boards/${boardId}/columns/${sourceColumnId}/groups/${cardData.groupId}/cardIds`);
          promises.push(set(groupCardIdsRef, newCardIds));
        }
      }
    }

    // Execute all operations atomically
    return Promise.all(promises)
      .then(() => {
        console.log(`Card ${cardId} moved from ${sourceColumnId} to ${targetColumnId}${targetGroupId ? ` (group ${targetGroupId})` : ''}`);
      })
      .catch(error => {
        console.error('Error moving card:', error);
        throw error; // Re-throw so caller can handle it
      });
  };

  // Create a new group with selected cards
  const createCardGroup = (columnId, cardIds, groupName = 'New Group', targetCreatedTime = null) => {
    if (!boardId || !user || !cardIds.length) {
      return;
    }

    const groupId = generateId();
    const groupRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}`);

    // Use target card's created time if provided, otherwise use current time
    const createdTime = targetCreatedTime || Date.now();

    // Create group with card ID references only
    const groupData = {
      name: groupName,
      created: createdTime,
      expanded: true,
      votes: 0,
      voters: {},
      cardIds // Just store the card IDs, not the card data
    };

    // Update each card to reference this group
    const cardUpdatePromises = cardIds.map(cardId => {
      const cardRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/groupId`);
      return set(cardRef, groupId);
    });

    // Create the group and update cards atomically
    Promise.all([
      set(groupRef, groupData),
      ...cardUpdatePromises
    ])
      .then(() => {
        console.log(`Group ${groupId} created with ${cardIds.length} cards`);
      })
      .catch(error => {
        console.error('Error creating group:', error);
      });
  };

  // Ungroup cards (remove group and clear groupId from cards)
  const ungroupCards = (columnId, groupId) => {
    if (!boardId || !user) {
      return;
    }

    const groupData = columns[columnId]?.groups?.[groupId];
    if (!groupData || !groupData.cardIds) {
      return;
    }

    const updatePromises = [];

    // Clear groupId from each card
    groupData.cardIds.forEach(cardId => {
      const cardRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/groupId`);
      updatePromises.push(remove(cardRef));
    });

    // Remove the group
    const groupRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}`);

    Promise.all([
      ...updatePromises,
      remove(groupRef)
    ])
      .then(() => {
        console.log(`Group ${groupId} ungrouped`);
      })
      .catch(error => {
        console.error('Error ungrouping cards:', error);
      });
  };

  // Update group name
  const updateGroupName = (columnId, groupId, newName) => {
    if (!boardId || !user) {
      return;
    }

    const nameRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/name`);
    set(nameRef, newName)
      .then(() => {
        console.log('Group name updated');
      })
      .catch(error => {
        console.error('Error updating group name:', error);
      });
  };

  // Toggle group expanded state
  const toggleGroupExpanded = (columnId, groupId, expanded) => {
    if (!boardId || !user) {
      return;
    }

    const expandedRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/expanded`);
    set(expandedRef, expanded)
      .catch(error => {
        console.error('Error updating group expanded state:', error);
      });
  };

  // Upvote a group
  const upvoteGroup = (columnId, groupId, currentVotes = 0, showNotification) => {
    if (!boardId || !user) {
      return;
    }

    const currentGroup = columns[columnId]?.groups?.[groupId];
    if (!currentGroup) {
      return;
    }

    const currentVoters = currentGroup.voters || {};
    const userId = user.uid;

    // Check vote limit - skip if not in retrospective mode
    if (retrospectiveMode) {
      const currentUserVotes = getUserVoteCount(userId);
      
      // For multiple votes allowed, check if adding this vote would exceed the limit
      if (multipleVotesAllowed) {
        if (currentUserVotes >= votesPerUser) {
          showNotification(`You've reached your vote limit (${votesPerUser} votes)`);
          return;
        }
      } else {
        // For single votes, check if user has already cast the maximum votes
        const userCurrentVote = currentVoters[userId] || 0;
        if (userCurrentVote === 0 && currentUserVotes >= votesPerUser) {
          showNotification(`You've reached your vote limit (${votesPerUser} votes)`);
          return;
        }
      }
    }

    // Check if multiple votes are allowed
    if (!multipleVotesAllowed && currentVoters[userId] && currentVoters[userId] > 0) {
      showNotification('You have already voted on this group');
      return;
    }

    const newVotes = currentVotes + 1;
    const newVoters = {
      ...currentVoters,
      [userId]: (currentVoters[userId] || 0) + 1
    };

    const groupVotesRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/votes`);
    const groupVotersRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/voters`);

    Promise.all([
      set(groupVotesRef, newVotes),
      set(groupVotersRef, newVoters)
    ]).then(() => {
      showNotification('Upvoted group');
    }).catch(error => {
      console.error('Error updating group votes:', error);
    });
  };

  // Downvote a group
  const downvoteGroup = (columnId, groupId, currentVotes = 0, showNotification) => {
    if (!boardId || !user) {
      return;
    }

    const currentGroup = columns[columnId]?.groups?.[groupId];
    if (!currentGroup) {
      return;
    }

    const currentVoters = currentGroup.voters || {};
    const userId = user.uid;

    // Check if multiple votes are allowed
    if (!multipleVotesAllowed && currentVoters[userId] && currentVoters[userId] < 0) {
      showNotification('You have already voted on this group');
      return;
    }

    const newVotes = currentVotes - 1;
    const newVoters = {
      ...currentVoters,
      [userId]: (currentVoters[userId] || 0) - 1
    };

    const groupVotesRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/votes`);
    const groupVotersRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/voters`);

    Promise.all([
      set(groupVotesRef, newVotes),
      set(groupVotersRef, newVoters)
    ]).then(() => {
      showNotification('Downvoted group');
    }).catch(error => {
      console.error('Error updating group votes:', error);
    });
  };

  // Update dark mode preference
  const updateDarkMode = enabled => {
    if (user) {
      const userPrefsRef = ref(database, `users/${user.uid}/preferences`);
      set(userPrefsRef, { darkMode: enabled })
        .then(() => {
          console.log('Dark mode preference updated:', enabled);
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

  // Start tracking card creation activity for current user
  const startCardCreation = (columnId) => {
    if (!boardId || !user) {
      return;
    }

    const activityRef = ref(database, `boards/${boardId}/cardCreationActivity/${user.uid}`);
    set(activityRef, {
      columnId,
      lastUpdated: Date.now(),
      uid: user.uid
    }).catch(error => {
      console.error('Error starting card creation tracking:', error);
    });
  };

  // Stop tracking card creation activity for current user
  const stopCardCreation = () => {
    if (!boardId || !user) {
      return;
    }

    const activityRef = ref(database, `boards/${boardId}/cardCreationActivity/${user.uid}`);
    remove(activityRef).catch(error => {
      console.error('Error stopping card creation tracking:', error);
    });
  };

  // Get users currently adding cards for a specific column
  const getUsersAddingCardsInColumn = (columnId) => {
    return Object.entries(usersAddingCards)
      .filter(([_userId, activity]) => activity.columnId === columnId)
      .map(([userId, activity]) => ({ userId, ...activity }));
  };

  // Get all users currently adding cards (across all columns)
  const getAllUsersAddingCards = () => {
    return Object.entries(usersAddingCards)
      .map(([userId, activity]) => ({ userId, ...activity }));
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
    getAllUsersAddingCards
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export default BoardContext;
