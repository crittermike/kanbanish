import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const NotificationContext = createContext(null);

/**
 * Provider that manages notification state and exposes showNotification().
 * Wrap the app tree with this to eliminate showNotification prop drilling.
 *
 * Notifications can optionally include an action button (e.g. "Undo")
 * via the options parameter: showNotification('message', { actionLabel, onAction, timeoutMs }).
 */
export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    message: '',
    show: false,
    actionLabel: null,
    onAction: null
  });
  const notificationTimeoutRef = useRef(null);
  // Store onAction in a ref so the dismiss callback doesn't go stale
  const onActionRef = useRef(null);

  const dismissNotification = useCallback(() => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
    onActionRef.current = null;
    setNotification({ message: '', show: false, actionLabel: null, onAction: null });
  }, []);

  const showNotification = useCallback((message, options = {}) => {
    const { actionLabel = null, onAction = null, timeoutMs = 3000 } = options;

    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    onActionRef.current = onAction;
    setNotification({ message, show: true, actionLabel, onAction });

    notificationTimeoutRef.current = setTimeout(() => {
      setNotification({ message: '', show: false, actionLabel: null, onAction: null });
      onActionRef.current = null;
      notificationTimeoutRef.current = null;
    }, timeoutMs);
  }, []);

  const handleAction = useCallback(() => {
    // Use the ref to get the latest callback
    const callback = onActionRef.current;
    dismissNotification();
    if (callback) {
      callback();
    }
  }, [dismissNotification]);

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notification, showNotification, dismissNotification, handleAction }}>
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
