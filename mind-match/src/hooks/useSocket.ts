import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export interface ServerToClientEvents {
  'new-message': (data: { message: any }) => void;
  'user-typing': (data: { userId: string; isTyping: boolean }) => void;
  'messages-read': (data: { userId: string; conversationId: string }) => void;
  'user-status-changed': (data: { userId: string; isOnline: boolean }) => void;
  'conversation-created': (data: any) => void;
  'conversations-updated': (data: { conversations: any[] }) => void;
  'request-accepted': (data: any) => void;
  'new-request': (data: any) => void;
  'error': (error: { message: string }) => void;
}

export interface ClientToServerEvents {
  'join-conversation': (conversationId: string) => void;
  'leave-conversation': (conversationId: string) => void;
  'send-message': (data: {
    conversationId: string;
    text: string;
    fileUrl?: string;
    fileType?: string;
    messageType?: string;
    codeSnippet?: { code: string; language: string };
  }) => void;
  'typing': (data: { conversationId: string; isTyping: boolean }) => void;
  'mark-read': (data: { conversationId: string }) => void;
  'update-status': (isOnline: boolean) => void;
}

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');

    // Initialize socket connection
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        socketRef.current?.emit('update-status', true);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setIsConnected(false);
      });

      socketRef.current.on('error', (err) => {
        console.error('Socket error:', err);
        toast({
          title: "Connection Error",
          description: err.message,
          variant: "destructive",
        });
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user, toast]);

  // Socket methods wrapper
  const sendMessage = useCallback((data: { conversationId: string; text: string; fileUrl?: string; fileType?: string }) => {
    socketRef.current?.emit('send-message', data);
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('join-conversation', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    // Note: If backend doesn't support leave-conversation explicitly, we might just rely on disconnect or component unmount. 
    // But keeping it for completeness if we add room leaving logic.
  }, []);

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    socketRef.current?.emit('typing', { conversationId, isTyping });
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('mark-read', { conversationId });
  }, []);

  const updateStatus = useCallback((isOnline: boolean) => {
    socketRef.current?.emit('update-status', isOnline);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    joinConversation,
    leaveConversation,
    sendTyping,
    markAsRead,
    updateStatus,
  };
};
