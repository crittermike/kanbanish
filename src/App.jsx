import React, { useState, useRef } from 'react';
import './styles/index.css';
import { BoardProvider } from './context/BoardContext';
import Board from './components/Board';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  const [notification, setNotification] = useState({ message: '', show: false });
  const notificationTimeoutRef = useRef(null);
  
  // Clean up timeout when component unmounts
  React.useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);
  
  // Show notification function that will be used throughout the app
  const showNotification = (message) => {
    // Clear any existing timeout to prevent premature closing
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    // Show the new notification
    setNotification({ message, show: true });
    
    // Set a new timeout and store the reference
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification({ message: '', show: false });
      notificationTimeoutRef.current = null;
    }, 3000);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <BoardProvider>
        <div className="App" data-testid="app-container">
          <Board showNotification={showNotification} />
          
          {/* Success Notification */}
          <div id="notification" className={`notification ${notification.show ? 'show' : ''}`}>
            <span id="notification-message">{notification.message}</span>
          </div>
        </div>
      </BoardProvider>
    </DndProvider>
  );
}

export default App;
