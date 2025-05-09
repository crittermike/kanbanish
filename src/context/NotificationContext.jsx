import React, { createContext, useState, useContext, useRef } from 'react';

// Create notification context
const NotificationContext = createContext();

// Create provider component
export function NotificationProvider({ children }) {
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
    <NotificationContext.Provider value={{ notification, showNotification }}>
      {children}
      {/* Render the notification element */}
      <div id="notification" className={`notification ${notification.show ? 'show' : ''}`}>
        <span id="notification-message">{notification.message}</span>
      </div>
    </NotificationContext.Provider>
  );
}

// Create a hook for using the notification context
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}