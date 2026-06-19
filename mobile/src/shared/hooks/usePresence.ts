import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSocket } from '../context/socket.context';

export interface UsePresenceReturn {
  isOnline: (userId: string) => boolean;
  getLastSeen: (userId: string) => string | null;
  fetchStatuses: (userIds: string[]) => void;
}

const PresenceContext = createContext<UsePresenceReturn | undefined>(undefined);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const [presenceMap, setPresenceMap] = useState<Map<string, boolean>>(new Map());
  const [lastSeenMap, setLastSeenMap] = useState<Map<string, string>>(new Map());
  const trackedUserIds = useRef<Set<string>>(new Set());

  // 1. On mount / socket connection, bind global listeners
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

    socket.on('presence:online', handleOnline);
    socket.on('presence:offline', handleOffline);

    // If socket reconnects, re-fetch statuses for all currently tracked users automatically
    if (socket.connected && trackedUserIds.current.size > 0) {
      const userIds = Array.from(trackedUserIds.current);
      socket.emit('presence:get_status', { userIds }, (response: any) => {
        if (response) {
          if (response.statuses) {
            setPresenceMap((prev) => {
              const next = new Map(prev);
              Object.entries(response.statuses).forEach(([uId, isOnline]) => {
                next.set(uId, !!isOnline);
              });
              return next;
            });
          }
          if (response.lastSeens) {
            setLastSeenMap((prev) => {
              const next = new Map(prev);
              Object.entries(response.lastSeens).forEach(([uId, lastSeen]) => {
                if (lastSeen) {
                  next.set(uId, lastSeen as string);
                }
              });
              return next;
            });
          }
        }
      });
    }

    return () => {
      socket.off('presence:online', handleOnline);
      socket.off('presence:offline', handleOffline);
    };
  }, [socket]);

  // 2. Periodic global heartbeat ping to show self as online
  useEffect(() => {
    if (!socket) return;

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

  // 3. Periodic background polling of tracked users' statuses (fallback/database middleware sync)
  useEffect(() => {
    if (!socket) return;

    const intervalId = setInterval(() => {
      if (socket.connected && trackedUserIds.current.size > 0) {
        const userIds = Array.from(trackedUserIds.current);
        socket.emit('presence:get_status', { userIds }, (response: { statuses?: Record<string, boolean>; lastSeens?: Record<string, string | null> }) => {
          if (response) {
            if (response.statuses) {
              const statuses = response.statuses;
              setPresenceMap((prev) => {
                const next = new Map(prev);
                Object.entries(statuses).forEach(([userId, isOnline]) => {
                  next.set(userId, isOnline);
                });
                return next;
              });
            }
            if (response.lastSeens) {
              const lastSeens = response.lastSeens;
              setLastSeenMap((prev) => {
                const next = new Map(prev);
                Object.entries(lastSeens).forEach(([userId, lastSeen]) => {
                  if (lastSeen) {
                    next.set(userId, lastSeen);
                  }
                });
                return next;
              });
            }
          }
        });
      }
    }, 30000); // Poll database state every 30 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [socket]);

  // 4. Fetch specific user statuses on demand (triggered by components)
  const fetchStatuses = useCallback((userIds: string[]) => {
    if (!socket || !userIds || userIds.length === 0) return;

    let hasNewId = false;
    userIds.forEach((id) => {
      if (id && !trackedUserIds.current.has(id)) {
        trackedUserIds.current.add(id);
        hasNewId = true;
      }
    });

    socket.emit('presence:get_status', { userIds }, (response: { statuses?: Record<string, boolean>; lastSeens?: Record<string, string | null> }) => {
      if (response) {
        if (response.statuses) {
          const statuses = response.statuses;
          setPresenceMap((prev) => {
            const next = new Map(prev);
            Object.entries(statuses).forEach(([userId, isOnline]) => {
              next.set(userId, isOnline);
            });
            return next;
          });
        }
        if (response.lastSeens) {
          const lastSeens = response.lastSeens;
          setLastSeenMap((prev) => {
            const next = new Map(prev);
            Object.entries(lastSeens).forEach(([userId, lastSeen]) => {
              if (lastSeen) {
                next.set(userId, lastSeen);
              }
            });
            return next;
          });
        }
      }
    });
  }, [socket]);

  const isOnline = useCallback((userId: string): boolean => {
    return presenceMap.get(userId) ?? false;
  }, [presenceMap]);

  const getLastSeen = useCallback((userId: string): string | null => {
    return lastSeenMap.get(userId) ?? null;
  }, [lastSeenMap]);

  const value = useMemo(() => ({
    isOnline,
    getLastSeen,
    fetchStatuses,
  }), [isOnline, getLastSeen, fetchStatuses]);

  return React.createElement(PresenceContext.Provider, { value }, children);
}

export function usePresence(): UsePresenceReturn {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}
