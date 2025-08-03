import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ref, onValue, off, set, remove } from 'firebase/database';
import { database, auth, signInAnonymously, get } from '../utils/firebase';
import { generateId } from '../utils/helpers';

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
  const [sortByVotes, setSortByVotes] = useState(false);
  const [votingEnabled, setVotingEnabled] = useState(true); // Default to enabled
  const [downvotingEnabled, setDownvotingEnabled] = useState(true); // Default to enabled
  const [multipleVotesAllowed, setMultipleVotesAllowed] = useState(false); // Default to disallowed
  const [revealMode, setRevealMode] = useState(false); // Default to disabled (cards are visible)
  const [cardsRevealed, setCardsRevealed] = useState(false); // Track if cards have been revealed
  const [boardRef, setBoardRef] = useState(null);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode

  // Firebase authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('User authenticated:', user.uid);
        setUser(user);

        // Load user preferences including theme
        const userPrefsRef = ref(database, `users/${user.uid}/preferences`);
        get(userPrefsRef).then((snapshot) => {
          if (snapshot.exists()) {
            const prefs = snapshot.val();
            if (prefs.darkMode !== undefined) {
              setDarkMode(prefs.darkMode);
            }
          }
        }).catch((error) => {
          console.error('Error loading user preferences:', error);
        });
      } else {
        console.log('No user, signing in anonymously');
        signInAnonymously(auth)
          .catch((error) => {
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
      onValue(newBoardRef, (snapshot) => {
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
            if (boardData.settings.revealMode !== undefined) {
              setRevealMode(boardData.settings.revealMode);
            }
            if (boardData.settings.cardsRevealed !== undefined) {
              setCardsRevealed(boardData.settings.cardsRevealed);
            }
          }
        }
      });

      return () => {
        off(newBoardRef);
      };
    }
  }, [boardId, user]);

  // Create a new board with specified template columns and title
  const createNewBoard = (templateColumns = null, boardTitle = 'Untitled Board') => {
    if (!user) return null;

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

    const initialData = {
      title: boardTitle,
      created: Date.now(),
      owner: user.uid,
      columns: columnsObj,
      settings: {
        votingEnabled: true, // Default to enabled for new boards
        downvotingEnabled: true, // Default to enabled for new boards
        multipleVotesAllowed: false, // Default to not allowing multiple votes
        revealMode: false, // Default to disabled (cards are visible)
        cardsRevealed: false // Default to cards not revealed
      }
    };

    set(newBoardRef, initialData)
      .then(() => {
        console.log('New board created with ID:', newBoardId);
        setBoardId(newBoardId);
        setBoardTitle('Untitled Board');
      })
      .catch((error) => {
        console.error('Error creating board:', error);
      });

    return newBoardId;
  };

  // Open an existing board
  const openExistingBoard = (boardIdToOpen) => {
    console.log('Opening board with ID:', boardIdToOpen);
    setBoardId(boardIdToOpen);
  };

  // Update board title
  const updateBoardTitle = (newTitle) => {
    // Optimistically update the local state first for better UI responsiveness
    setBoardTitle(newTitle);

    if (boardId && user) {
      const titleRef = ref(database, `boards/${boardId}/title`);
      set(titleRef, newTitle)
        .then(() => {
          console.log('Board title updated');
        })
        .catch((error) => {
          console.error('Error updating board title:', error);
        });
    }
  };

  // Update board settings with merged values
  const updateBoardSettings = (newSettings) => {
    if (boardId && user) {
      const settingsRef = ref(database, `boards/${boardId}/settings`);
      // Merge new settings with existing state
      const updatedSettings = {
        votingEnabled: votingEnabled,
        downvotingEnabled: downvotingEnabled,
        multipleVotesAllowed: multipleVotesAllowed,
        revealMode: revealMode,
        cardsRevealed: cardsRevealed,
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
          if (newSettings.revealMode !== undefined) {
            setRevealMode(newSettings.revealMode);
          }
          if (newSettings.cardsRevealed !== undefined) {
            setCardsRevealed(newSettings.cardsRevealed);
          }
        })
        .catch((error) => {
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
      if (newSettings.revealMode !== undefined) {
        const newRevealMode = newSettings.revealMode;
        const currentRevealMode = revealModeRef.current;
        
        // Only reset cardsRevealed if revealMode actually changes
        if (currentRevealMode !== newRevealMode) {
          setRevealMode(newRevealMode);
          setCardsRevealed(!newRevealMode);
        } else {
          // Just update revealMode without affecting cardsRevealed
          setRevealMode(newRevealMode);
        }
      }
      if (newSettings.cardsRevealed !== undefined) {
        setCardsRevealed(newSettings.cardsRevealed);
      }
    }
  };

  // Update voting enabled setting
  const updateVotingEnabled = (enabled) => {
    updateBoardSettings({ votingEnabled: enabled });
  };

  // Update downvoting enabled setting
  const updateDownvotingEnabled = (enabled) => {
    updateBoardSettings({ downvotingEnabled: enabled });
  };

  // Update multiple votes allowed setting
  const updateMultipleVotesAllowed = (allowed) => {
    updateBoardSettings({ multipleVotesAllowed: allowed });
  };

  // Update reveal mode setting
  const updateRevealMode = (enabled) => {
    if (enabled) {
      // When enabling reveal mode, just update that setting
      updateBoardSettings({ revealMode: enabled });
    } else {
      // When disabling reveal mode, also reset cardsRevealed to false
      updateBoardSettings({ revealMode: enabled, cardsRevealed: false });
    }
  };

  // Reveal all cards (persist to Firebase)
  const revealAllCards = () => {
    updateBoardSettings({ cardsRevealed: true });
  };

  // Reset all votes in the board
  const resetAllVotes = () => {
    if (!boardId || !user) return false;

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

  // Move a card between columns or into/out of groups
  const moveCard = (cardId, sourceColumnId, targetColumnId, targetGroupId = null) => {
    if (!boardId || !user) return;

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

      // Create new card data without groupId (cards move to target column ungrouped)
      const { groupId, ...cardDataWithoutGroup } = cardData;
      
      promises.push(remove(sourceCardRef));
      promises.push(set(targetCardRef, cardDataWithoutGroup));

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
    Promise.all(promises)
      .then(() => {
        console.log(`Card ${cardId} moved from ${sourceColumnId} to ${targetColumnId}${targetGroupId ? ` (group ${targetGroupId})` : ''}`);
      })
      .catch((error) => {
        console.error('Error moving card:', error);
      });
  };

  // Create a new group with selected cards
  const createCardGroup = (columnId, cardIds, groupName = 'New Group', targetCreatedTime = null) => {
    if (!boardId || !user || !cardIds.length) return;

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
      cardIds: cardIds // Just store the card IDs, not the card data
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
      .catch((error) => {
        console.error('Error creating group:', error);
      });
  };

  // Ungroup cards (remove group and clear groupId from cards)
  const ungroupCards = (columnId, groupId) => {
    if (!boardId || !user) return;

    const groupData = columns[columnId]?.groups?.[groupId];
    if (!groupData || !groupData.cardIds) return;

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
      .catch((error) => {
        console.error('Error ungrouping cards:', error);
      });
  };

  // Update group name
  const updateGroupName = (columnId, groupId, newName) => {
    if (!boardId || !user) return;

    const nameRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/name`);
    set(nameRef, newName)
      .then(() => {
        console.log('Group name updated');
      })
      .catch((error) => {
        console.error('Error updating group name:', error);
      });
  };

  // Toggle group expanded state
  const toggleGroupExpanded = (columnId, groupId, expanded) => {
    if (!boardId || !user) return;

    const expandedRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/expanded`);
    set(expandedRef, expanded)
      .catch((error) => {
        console.error('Error updating group expanded state:', error);
      });
  };

  // Upvote a group
  const upvoteGroup = (columnId, groupId, currentVotes = 0, showNotification) => {
    if (!boardId || !user) return;

    const currentGroup = columns[columnId]?.groups?.[groupId];
    if (!currentGroup) return;

    const currentVoters = currentGroup.voters || {};
    const userId = user.uid;

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
    ]).catch((error) => {
      console.error('Error updating group votes:', error);
    });
  };

  // Downvote a group
  const downvoteGroup = (columnId, groupId, currentVotes = 0, showNotification) => {
    if (!boardId || !user) return;

    const currentGroup = columns[columnId]?.groups?.[groupId];
    if (!currentGroup) return;

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
    ]).catch((error) => {
      console.error('Error updating group votes:', error);
    });
  };

  // Update dark mode preference
  const updateDarkMode = (enabled) => {
    if (user) {
      const userPrefsRef = ref(database, `users/${user.uid}/preferences`);
      set(userPrefsRef, { darkMode: enabled })
        .then(() => {
          console.log('Dark mode preference updated:', enabled);
          setDarkMode(enabled);
        })
        .catch((error) => {
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
    revealMode,
    setRevealMode,
    updateRevealMode,
    cardsRevealed,
    setCardsRevealed,
    revealAllCards,
    updateBoardSettings,
    boardRef,
    createNewBoard,
    openExistingBoard,
    moveCard,
    resetAllVotes,
    darkMode,
    updateDarkMode,
    // Card grouping functions
    createCardGroup,
    ungroupCards,
    updateGroupName,
    toggleGroupExpanded,
    upvoteGroup,
    downvoteGroup
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export default BoardContext;
