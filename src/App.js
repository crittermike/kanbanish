import React, { useState, useEffect } from 'react';
import './styles/index.css';
import { BoardProvider } from './context/BoardContext';
import Board from './components/Board';
import CardDetailModal from './components/modals/CardDetailModal';
import OpenBoardModal from './components/modals/OpenBoardModal';

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
    <BoardProvider>
      <div className="App">
        <Board showNotification={showNotification} />
        
        {/* Modals */}
        <CardDetailModal showNotification={showNotification} />
        <OpenBoardModal />
        
        {/* Success Notification */}
        <div id="notification" className={`notification ${notification.show ? 'show' : ''}`}>
          <span id="notification-message">{notification.message}</span>
        </div>
      </div>
    </BoardProvider>
  );
}

export default App;
