import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [boardLocked, setBoardLocked] = useState(false); // Default to unlocked
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
            if (boardData.settings.boardLocked !== undefined) {
              setBoardLocked(boardData.settings.boardLocked);
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
        boardLocked: false // Default to unlocked for new boards
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
    if (boardId && user) {
      const titleRef = ref(database, `boards/${boardId}/title`);
      set(titleRef, newTitle)
        .then(() => {
          console.log('Board title updated');
          setBoardTitle(newTitle);
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
        boardLocked: boardLocked,
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
          if (newSettings.boardLocked !== undefined) {
            setBoardLocked(newSettings.boardLocked);
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
      if (newSettings.boardLocked !== undefined) {
        setBoardLocked(newSettings.boardLocked);
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
  
  // Update board locked setting
  const updateBoardLocked = (locked) => {
    updateBoardSettings({ boardLocked: locked });
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
    });
    
    return true;
  };

  // Move a card between columns
  const moveCard = (cardId, sourceColumnId, targetColumnId) => {
    if (!boardId || !user || sourceColumnId === targetColumnId) return;
    
    const sourceCardRef = ref(database, `boards/${boardId}/columns/${sourceColumnId}/cards/${cardId}`);
    const targetCardRef = ref(database, `boards/${boardId}/columns/${targetColumnId}/cards/${cardId}`);
    
    // Get the current card data
    const cardData = columns[sourceColumnId]?.cards?.[cardId];
    
    if (!cardData) {
      console.error('Card not found');
      return;
    }
    
    // Add the card to the target column
    set(targetCardRef, cardData)
      .then(() => {
        // Remove the card from the source column
        remove(sourceCardRef)
          .then(() => {
            console.log(`Card ${cardId} moved from ${sourceColumnId} to ${targetColumnId}`);
          })
          .catch((error) => {
            console.error('Error removing card from source column:', error);
          });
      })
      .catch((error) => {
        console.error('Error adding card to target column:', error);
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
    boardLocked,
    setBoardLocked,
    updateBoardLocked,
    updateBoardSettings,
    boardRef,
    createNewBoard,
    openExistingBoard,
    moveCard,
    resetAllVotes,
    darkMode,
    updateDarkMode
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export default BoardContext;
