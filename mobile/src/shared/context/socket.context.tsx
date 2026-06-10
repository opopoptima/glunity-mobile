import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../modules/auth/state/auth.context';
import { TokenStore } from '../../core/storage/secure-store';
import { API_BASE_URL } from '../../core/config/api.config';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

const CORE_API_URL = API_BASE_URL;
const MSG_SERVICE_URL = CORE_API_URL.replace(':5000', ':5001');
const MSG_SERVICE_SOCKET_URL = MSG_SERVICE_URL.replace('/api', '');

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('[SocketProvider] Disconnecting socket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      const token = await TokenStore.getAccessToken();
      if (!token || !user) {
        disconnect();
        return;
      }

      // If we already have a connection, don't re-create it
      if (socketRef.current && socketRef.current.connected) {
        return;
      }

      // If there's an existing socket that is disconnected, clean it up first
      if (socketRef.current) {
        disconnect();
      }

      console.log('[SocketProvider] Connecting to socket service:', MSG_SERVICE_SOCKET_URL);
      const s = io(MSG_SERVICE_SOCKET_URL, {
        auth: { token },
        transports: ['websocket'], // Use WebSocket for efficiency and stability in mobile envs
      });

      s.on('connect', () => {
        console.log('[SocketProvider] Socket connected successfully');
        setIsConnected(true);
      });

      s.on('disconnect', (reason) => {
        console.log('[SocketProvider] Socket disconnected, reason:', reason);
        setIsConnected(false);
      });

      s.on('connect_error', (err) => {
        console.warn('[SocketProvider] Socket connect_error:', err);
        setIsConnected(false);
      });

      socketRef.current = s;
      setSocket(s);
    } catch (err) {
      console.warn('[SocketProvider] Failed to initialize socket connection:', err);
      setIsConnected(false);
    }
  }, [user, disconnect]);

  // Connect socket automatically when user changes (login/logout/token updates)
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      // We don't necessarily want to disconnect on every rerender, 
      // but clean up when provider unmounts or user changes.
      if (!user) {
        disconnect();
      }
    };
  }, [user, connect, disconnect]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used inside a <SocketProvider>');
  }
  return ctx;
}
