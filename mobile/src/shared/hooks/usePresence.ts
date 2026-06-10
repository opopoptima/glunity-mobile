import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useSocket } from '../context/socket.context';
import { useAuth } from '../../modules/auth/state/auth.context';

const HEARTBEAT_INTERVAL_MS = 25_000; // 25 s  (server TTL is 30 s)

/**
 * Manages real-time presence:
 *  - Sends `presence:ping` heartbeats so the server keeps the user marked online
 *  - Listens to `presence:online` / `presence:offline` events from the server
 *  - Returns an `onlineUsers` Set<string> of user IDs that are currently online
 *
 * Usage:
 *   const { isOnline } = usePresence();
 *   isOnline(userId)  → boolean
 */
export function usePresence() {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // Map<userId, boolean>  (true = online)
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef  = useRef<AppStateStatus>(AppState.currentState);

  // ── Heartbeat ──────────────────────────────────────────────────────────────
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) return;
    heartbeatRef.current = setInterval(() => {
      if (socket?.connected) {
        socket.emit('presence:ping');
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, [socket]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // ── Start/stop heartbeat when socket connects/disconnects ─────────────────
  useEffect(() => {
    if (!socket || !isConnected) {
      stopHeartbeat();
      return;
    }
    startHeartbeat();
    return stopHeartbeat;
  }, [socket, isConnected, startHeartbeat, stopHeartbeat]);

  // ── Pause heartbeat when app goes to background (mobile only) ────────────
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (nextState === 'active' && prev !== 'active') {
        startHeartbeat();
      } else if (nextState !== 'active') {
        stopHeartbeat();
      }
    });
    return () => sub.remove();
  }, [startHeartbeat, stopHeartbeat]);

  // ── Listen to server presence events ─────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleOnline = ({ userId }: { userId: string }) => {
      setOnlineMap((prev) => (prev[userId] ? prev : { ...prev, [userId]: true }));
    };

    const handleOffline = ({ userId }: { userId: string }) => {
      setOnlineMap((prev) => {
        if (!prev[userId]) return prev;
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    socket.on('presence:online',  handleOnline);
    socket.on('presence:offline', handleOffline);

    return () => {
      socket.off('presence:online',  handleOnline);
      socket.off('presence:offline', handleOffline);
    };
  }, [socket]);

  // ── Mark self as online in local map immediately after login ─────────────
  useEffect(() => {
    if (!user?._id) return;
    setOnlineMap((prev) => ({ ...prev, [String(user._id)]: true }));
  }, [user?._id]);

  const isOnline = useCallback(
    (userId: string | undefined | null): boolean => {
      if (!userId) return false;
      return !!onlineMap[String(userId)];
    },
    [onlineMap]
  );

  return { onlineMap, isOnline };
}
