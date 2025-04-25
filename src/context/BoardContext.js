import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, onValue, off, set } from 'firebase/database';
import { database, auth, signInAnonymously } from '../utils/firebase';

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
  const [activeCardId, setActiveCardId] = useState(null);
  const [activeColumnId, setActiveColumnId] = useState(null);
  const [isNewCard, setIsNewCard] = useState(false);
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
        const data = snapshot.val();
        if (data) {
          if (data.title) setBoardTitle(data.title);
          if (data.columns) setColumns(data.columns);
        }
      });

      return () => {
        // Clean up listener when component unmounts or boardId changes
        off(newBoardRef);
      };
    }
  }, [boardId, user]);

  // Create a new board
  const createNewBoard = () => {
    const newBoardId = Math.random().toString(36).substring(2, 10);
    
    // Create initial board data in Firebase
    const newBoardRef = ref(database, `boards/${newBoardId}`);
    set(newBoardRef, {
      title: 'Untitled Board',
      columns: {}
    }).then(() => {
      console.log('New board created in Firebase');
    }).catch(error => {
      console.error('Error creating new board:', error);
    });
    
    setBoardId(newBoardId);
    setBoardTitle('Untitled Board');
    setColumns({});
    return newBoardId;
  };

  // Open an existing board
  const openExistingBoard = (id) => {
    setBoardId(id);
  };

  // Value object to provide through the context
  const value = {
    user,
    boardId,
    boardRef,
    boardTitle, 
    setBoardTitle,
    columns,
    setColumns,
    sortByVotes, 
    setSortByVotes,
    activeCardId, 
    setActiveCardId,
    activeColumnId, 
    setActiveColumnId,
    isNewCard, 
    setIsNewCard,
    createNewBoard,
    openExistingBoard
  };

  return (
    <BoardContext.Provider value={value}>
      {children}
    </BoardContext.Provider>
  );
};

export default BoardContext;
