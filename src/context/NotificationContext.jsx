import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const NotificationContext = createContext(null);

/**
 * Provider that manages notification state and exposes showNotification().
 * Wrap the app tree with this to eliminate showNotification prop drilling.
 */
export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({ message: '', show: false });
  const notificationTimeoutRef = useRef(null);

  const showNotification = useCallback((message) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ message, show: true });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification({ message: '', show: false });
      notificationTimeoutRef.current = null;
    }, 3000);
  }, []);

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notification, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook to access notification state and showNotification function.
 * Must be used within a NotificationProvider.
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
