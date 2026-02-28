import { WifiOff } from 'react-feather';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

/**
 * Renders a subtle top-of-screen banner when the Firebase connection is lost.
 * Automatically hides when the connection is restored.
 */
const OfflineIndicator = () => {
  const { isOnline } = useConnectionStatus();

  if (isOnline) return null;

  return (
    <div className="offline-indicator" role="alert" aria-live="polite">
      <WifiOff size={14} />
      <span>You&rsquo;re offline — changes will sync when reconnected</span>
    </div>
  );
};

export default OfflineIndicator;
