import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { Card, CardBody, Chip, Button } from '@heroui/react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
  addToast: (options: { type?: ToastType; title?: string; message: string } | string, messageOrTitle?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (options: { type?: ToastType; title?: string; message: string } | string, messageOrTitle?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      let type: ToastType = 'info';
      let message = '';
      let title: string | undefined;

      if (typeof options === 'object' && options !== null) {
        type = options.type || 'info';
        message = options.message || '';
        title = options.title;
      } else {
        type = (options as ToastType) || 'info';
        message = messageOrTitle || '';
      }

      setToasts((prev) => [...prev, { id, type, message, title }]);

      setTimeout(() => {
        removeToast(id);
      }, 4200);
    },
    [removeToast]
  );

  const toast = {
    success: (msg: string) => addToast({ type: 'success', message: msg }),
    error: (msg: string) => addToast({ type: 'error', message: msg }),
    info: (msg: string) => addToast({ type: 'info', message: msg }),
    warning: (msg: string) => addToast({ type: 'warning', message: msg }),
  };

  return (
    <ToastContext.Provider value={{ toast, addToast }}>
      {children}
      {/* HeroUI Modern Toast Notification Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto"
            >
              <Card
                className={`border backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden ${
                  t.type === 'success'
                    ? 'border-success-200 dark:border-success-900/50 bg-content1/95'
                    : t.type === 'error'
                    ? 'border-danger-200 dark:border-danger-900/50 bg-content1/95'
                    : 'border-primary-200 dark:border-primary-900/50 bg-content1/95'
                }`}
              >
                <CardBody className="p-3.5 flex flex-row items-center gap-3">
                  <div className="shrink-0">
                    {t.type === 'success' && (
                      <div className="p-1.5 rounded-xl bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    {t.type === 'error' && (
                      <div className="p-1.5 rounded-xl bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    )}
                    {t.type === 'info' && (
                      <div className="p-1.5 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                        <Info className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-snug">
                      {t.message}
                    </p>
                  </div>

                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => removeToast(t.id)}
                    className="text-default-400 hover:text-default-700 min-w-6 w-6 h-6 rounded-lg"
                    aria-label="Close notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
