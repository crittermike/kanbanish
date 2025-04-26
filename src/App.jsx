import React, { useState } from 'react';
import './styles/index.css';
import { BoardProvider } from './context/BoardContext';
import Board from './components/Board';
import OpenBoardModal from './components/modals/OpenBoardModal';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  const [notification, setNotification] = useState({ message: '', show: false });
  
  // Show notification function that will be used throughout the app
  const showNotification = (message) => {
    setNotification({ message, show: true });
    setTimeout(() => {
      setNotification({ message: '', show: false });
    }, 3000);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <BoardProvider>
        <div className="App" data-testid="app-container">
          <Board showNotification={showNotification} />
          
          {/* Modals */}
          <OpenBoardModal />
          
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
