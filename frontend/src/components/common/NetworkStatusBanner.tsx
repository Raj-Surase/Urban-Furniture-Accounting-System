import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@heroui/react';
import { useSocket } from '../../context/SocketContext';

export const NetworkStatusBanner: React.FC = () => {
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(navigator.onLine);
  const [apiErrorDismissed, setApiErrorDismissed] = useState<boolean>(false);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  const { isConnected, socket } = useSocket();

  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    const handleApiError = (event: Event) => {
      const customEvent = event as CustomEvent;
      setApiErrorMessage(customEvent.detail?.message || 'Backend API is currently unreachable.');
      setApiErrorDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('api:network-error', handleApiError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('api:network-error', handleApiError);
    };
  }, []);

  const handleManualReconnect = () => {
    if (socket && !socket.connected) {
      socket.connect();
    }
    setApiErrorMessage(null);
    setApiErrorDismissed(false);
  };

  const showOffline = !isBrowserOnline;
  const showSocketDown = isBrowserOnline && !isConnected;
  const showApiError = isBrowserOnline && apiErrorMessage && !apiErrorDismissed;

  if (!showOffline && !showSocketDown && !showApiError) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full bg-amber-500/15 dark:bg-amber-950/40 border-b border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs backdrop-blur-md z-50 sticky top-0"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {showOffline ? (
              <>
                <WifiOff className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-semibold">You appear to be offline.</span>
                <span className="hidden sm:inline text-amber-800 dark:text-amber-300">
                  Please check your internet connection.
                </span>
              </>
            ) : showApiError ? (
              <>
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-semibold">Backend Unreachable:</span>
                <span className="truncate">{apiErrorMessage}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="font-semibold">WebSocket Disconnected:</span>
                <span className="hidden sm:inline text-amber-800 dark:text-amber-300">
                  Realtime updates are paused. Attempting auto-reconnect...
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="flat"
              color="warning"
              className="h-7 text-xs font-semibold px-2.5"
              startContent={<RefreshCw className="w-3 h-3" />}
              onPress={handleManualReconnect}
            >
              Retry
            </Button>
            {showApiError && (
              <button
                onClick={() => setApiErrorDismissed(true)}
                className="p-1 hover:bg-amber-200/50 dark:hover:bg-amber-800/50 rounded text-amber-700 dark:text-amber-300"
                aria-label="Dismiss error notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
