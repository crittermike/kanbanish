import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Board from './components/Board';
import { BoardProvider } from './context/BoardContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';

function AppContent() {
  const { notification } = useNotification();

  return (
    <div className="App" data-testid="app-container">
      <Board />

      {/* Success Notification */}
      <div id="notification" className={`notification ${notification.show ? 'show' : ''}`}>
        <span id="notification-message">{notification.message}</span>
      </div>
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <DndProvider backend={HTML5Backend}>
        <BoardProvider>
          <AppContent />
        </BoardProvider>
      </DndProvider>
    </NotificationProvider>
  );
}

export default App;
