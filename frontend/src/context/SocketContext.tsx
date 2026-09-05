import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from './ToastContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { toast } = useToast();
  const activeChannels = useRef<Set<string>>(new Set());

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected with ID:', s.id);
      // Re-join any active channels after reconnection
      activeChannels.current.forEach((channel) => {
        s.emit('subscribe', channel);
      });
    });

    s.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('[Socket] Disconnected:', reason);
    });

    s.on('connect_error', (err) => {
      setIsConnected(false);
      console.warn('[Socket] Connection error:', err.message);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const subscribe = useCallback((channel: string) => {
    activeChannels.current.add(channel);
    if (socket && isConnected) {
      socket.emit('subscribe', channel);
    }
  }, [socket, isConnected]);

  const unsubscribe = useCallback((channel: string) => {
    activeChannels.current.delete(channel);
    if (socket && isConnected) {
      socket.emit('unsubscribe', channel);
    }
  }, [socket, isConnected]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, subscribe, unsubscribe }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

