import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, onValue, off, set } from 'firebase/database';
import { database, auth, signInAnonymously } from '../utils/firebase';
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
  const [boardRef, setBoardRef] = useState(null);

  // Firebase authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('User authenticated:', user.uid);
        setUser(user);
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
        }
      });

      return () => {
        off(newBoardRef);
      };
    }
  }, [boardId, user]);

  // Create a new board
  const createNewBoard = () => {
    if (!user) return null;
    
    const newBoardId = generateId();
    const newBoardRef = ref(database, `boards/${newBoardId}`);
    
    const initialData = {
      title: 'Untitled Board',
      created: Date.now(),
      owner: user.uid,
      columns: {
        [generateId()]: {
          title: 'To Do',
          cards: {}
        },
        [generateId()]: {
          title: 'In Progress',
          cards: {}
        },
        [generateId()]: {
          title: 'Done',
          cards: {}
        }
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
    boardRef,
    createNewBoard,
    openExistingBoard
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export default BoardContext;
