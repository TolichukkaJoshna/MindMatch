import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface PresenceContextType {
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Initial fetch of active statuses (optional, if API exists)
  useEffect(() => {
    if (user) {
        // Here we could fetch the initial list of online users if an endpoint exists
        // api.getActiveStatuses().then(users => { ... })
        // For now, we rely on socket updates and maybe initial participant lists in conversations
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleStatusAuth = (data: { userId: string; isOnline: boolean }) => {
        setOnlineUsers(prev => {
            const newSet = new Set(prev);
            if (data.isOnline) {
                newSet.add(data.userId);
            } else {
                newSet.delete(data.userId);
            }
            return newSet;
        });
    };

    socket.on('user-status-changed', handleStatusAuth);

    return () => {
        socket.off('user-status-changed', handleStatusAuth);
    };
  }, [socket]);

  const isUserOnline = (userId: string) => {
      // If we don't have the user in our Set, we could fallback to the user object's last known status if available
      // But purely real-time:
      return onlineUsers.has(userId);
  };

  return (
    <PresenceContext.Provider value={{ onlineUsers, isUserOnline }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};
