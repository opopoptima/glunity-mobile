import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/socket.context';

export interface UsePresenceReturn {
  isOnline: (userId: string) => boolean;
  getLastSeen: (userId: string) => string | null;
  fetchStatuses: (userIds: string[]) => void;
}

export function usePresence(): UsePresenceReturn {
  const { socket } = useSocket();
  const [presenceMap, setPresenceMap] = useState<Map<string, boolean>>(new Map());
  const [lastSeenMap, setLastSeenMap] = useState<Map<string, string>>(new Map());

  // Keep a ref to all user IDs we are currently tracking so we can re-sync on reconnect
  const trackedIdsRef = useRef<Set<string>>(new Set());

  // 1. On mount / socket change, listen for server presence events
  useEffect(() => {
    if (!socket) return;

    const handleOnline = ({ userId }: { userId: string }) => {
      setPresenceMap((prev) => {
        const next = new Map(prev);
        next.set(userId, true);
        return next;
      });
    };

    const handleOffline = ({ userId, lastSeen }: { userId: string; lastSeen?: string }) => {
      setPresenceMap((prev) => {
        const next = new Map(prev);
        next.set(userId, false);
        return next;
      });
      if (lastSeen) {
        setLastSeenMap((prev) => {
          const next = new Map(prev);
          next.set(userId, lastSeen);
          return next;
        });
      }
    };

    // On reconnect, re-fetch statuses for all tracked users so online dots are correct
    const handleConnect = () => {
      const ids = [...trackedIdsRef.current];
      if (ids.length === 0) return;
      socket.emit('presence:get_status', { userIds: ids }, (response: { statuses?: Record<string, boolean> }) => {
        if (response && response.statuses) {
          setPresenceMap((prev) => {
            const next = new Map(prev);
            Object.entries(response.statuses!).forEach(([uid, online]) => {
              next.set(uid, online);
            });
            return next;
          });
        }
      });
    };

    socket.on('presence:online', handleOnline);
    socket.on('presence:offline', handleOffline);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('presence:online', handleOnline);
      socket.off('presence:offline', handleOffline);
      socket.off('connect', handleConnect);
    };
  }, [socket]);

  // 2. Send heartbeat every 25 seconds to keep our own status alive
  useEffect(() => {
    if (!socket) return;

    // Send a ping immediately on connect/mount if connected
    if (socket.connected) {
      socket.emit('presence:ping');
    }

    const intervalId = setInterval(() => {
      if (socket.connected) {
        socket.emit('presence:ping');
      }
    }, 25000);

    return () => {
      clearInterval(intervalId);
    };
  }, [socket]);

  // 3. fetchStatuses(userIds) — also records the IDs we are tracking for re-sync on reconnect
  const fetchStatuses = useCallback((userIds: string[]) => {
    if (!socket || !userIds || userIds.length === 0) return;

    // Track these IDs so we re-fetch on socket reconnect
    userIds.forEach((id) => trackedIdsRef.current.add(id));

    socket.emit('presence:get_status', { userIds }, (response: { statuses?: Record<string, boolean> }) => {
      if (response && response.statuses) {
        const statuses = response.statuses;
        setPresenceMap((prev) => {
          const next = new Map(prev);
          Object.entries(statuses).forEach(([userId, isOnline]) => {
            next.set(userId, isOnline);
          });
          return next;
        });
      }
    });
  }, [socket]);

  // 4. isOnline(userId)
  const isOnline = useCallback((userId: string): boolean => {
    return presenceMap.get(userId) ?? false;
  }, [presenceMap]);

  // getLastSeen(userId)
  const getLastSeen = useCallback((userId: string): string | null => {
    return lastSeenMap.get(userId) ?? null;
  }, [lastSeenMap]);

  return {
    isOnline,
    getLastSeen,
    fetchStatuses,
  };
}
