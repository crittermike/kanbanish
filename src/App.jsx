import React from 'react';
import './styles/index.css';
import { BoardProvider } from './context/BoardContext';
import { NotificationProvider } from './context/NotificationContext';
import Board from './components/Board';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <NotificationProvider>
        <BoardProvider>
          <div className="App" data-testid="app-container">
            <Board />
          </div>
        </BoardProvider>
      </NotificationProvider>
    </DndProvider>
  );
}

export default App;
