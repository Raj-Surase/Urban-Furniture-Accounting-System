import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from './ToastContext';

const resolveSocketUrl = (): string => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (!envUrl) {
    return typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : 'http://localhost:3001';
  }
  try {
    const parsed = new URL(envUrl);
    if ((parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') && typeof window !== 'undefined') {
      parsed.hostname = window.location.hostname;
      return parsed.origin;
    }
  } catch {
    // ignore
  }
  return envUrl;
};

const SOCKET_URL = resolveSocketUrl();

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
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    s.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected with ID:', s.id);
      // Re-join any active channels after reconnection
      activeChannels.current.forEach((channel) => {
        s.emit('subscribe', channel);
      });
    });

    s.on('reconnect', (attemptNumber) => {
      setIsConnected(true);
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
      activeChannels.current.forEach((channel) => {
        s.emit('subscribe', channel);
      });
    });

    s.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('[Socket] Disconnected:', reason);
      if (reason === 'io server disconnect') {
        s.connect();
      }
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

