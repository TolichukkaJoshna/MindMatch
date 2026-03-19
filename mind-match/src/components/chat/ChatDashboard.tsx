import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { MessageSquare, Menu } from 'lucide-react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { UserInfoPanel } from './UserInfoPanel';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSocket } from '@/hooks/useSocket';

export const ChatDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserInfo, setShowUserInfo] = useState(true); // Default open on large screens? Or closed.
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Initial fetch
  useEffect(() => {
    fetchConversations();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle conversation ID from navigation state (from request acceptance)
  useEffect(() => {
    const state = location.state as any;
    if (state?.conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c._id === state.conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [location.state, conversations]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleConversationCreated = (data: any) => {
      console.log('New conversation created:', data);
      fetchConversations(); // Refresh conversation list
    };

    const handleConversationsUpdated = (data: any) => {
      setConversations(data.conversations || []);
    };

    const handleRequestAccepted = (data: any) => {
      console.log('Request accepted:', data);
      fetchConversations(); // Refresh to show new conversation
    };

    const handleMessagesRead = (data: any) => {
      // When ANY user marks messages as read, refresh conversation list
      // This includes when the current user marks their own messages as read
      console.log('Messages marked as read:', data);
      fetchConversations();
    };

    const handleNewMessage = (data: any) => {
      // When a new message arrives, refresh to update unread counts
      fetchConversations();
    };

    socket.on('conversation-created', handleConversationCreated);
    socket.on('conversations-updated', handleConversationsUpdated);
    socket.on('request-accepted', handleRequestAccepted);
    socket.on('messages-read', handleMessagesRead);
    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('conversation-created', handleConversationCreated);
      socket.off('conversations-updated', handleConversationsUpdated);
      socket.off('request-accepted', handleRequestAccepted);
      socket.off('messages-read', handleMessagesRead);
      socket.off('new-message', handleNewMessage);
    };
  }, [socket]);

  const fetchConversations = async (includeArchived = false) => {
    setIsLoading(true);
    try {
      console.log('Fetching conversations, includeArchived:', includeArchived);
      const response = await api.getConversations(includeArchived);
      const convs = response.data.conversations || [];
      console.log('Fetched conversations:', convs.length);
      convs.forEach(c => {
        console.log(`  - ${c.groupName || c.participants?.find((p: any) => p._id !== user?._id)?.name || 'Unknown'}: unread=${c.unreadCount}`);
      });
      setConversations(convs);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle conversation being marked as read - optimistic UI update
  const handleConversationRead = (conversationId: string) => {
    console.log('[ChatDashboard] Conversation marked as read:', conversationId);
    // Optimistically update the conversation list
    setConversations(prevConvs =>
      prevConvs.map(conv =>
        conv._id === conversationId
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
    // Also fetch fresh data to ensure consistency
    setTimeout(() => {
      fetchConversations();
    }, 300);
  };

  const handleTabChange = (tab: string) => {
    // If tab is 'archived', fetch archived. Else fetch active.
    if (tab === 'archived') {
      fetchConversations(true);
    } else {
      // Optimization: if we already have active ones, maybe don't re-fetch? 
      // But 'unread'/'groups' are subsets of 'all' (active).
      // So just ensure we have active.
      // For simplicity, just fetch active always when switching back from archived.
      // Note: if switching between 'all' and 'unread', no need to fetch if we have 'all'.
      fetchConversations(false);
    }
  };

  const toggleUserInfo = () => setShowUserInfo(!showUserInfo);

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Mobile Layout: List or Chat */}
        {!selectedConversation ? (
          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={(c) => {
                console.log('Conversation selected (mobile):', c._id, 'Unread count:', c.unreadCount);
                setSelectedConversation(c);
                // Immediately refresh conversations to update unread counts
                setTimeout(() => {
                  console.log('Refreshing conversations after selection (mobile)...');
                  fetchConversations();
                }, 500);
              }}
              isLoading={isLoading}
              onTabChange={handleTabChange}
              onRefresh={fetchConversations}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <ChatWindow
              conversation={selectedConversation}
              onBack={() => setSelectedConversation(null)}
              onUpdate={() => fetchConversations()}
              onConversationRead={handleConversationRead}
            // Pass a prop to toggle Info Sheet?
            // Mobile ChatWindow needs to handle "Info" button to open Sheet.
            />
            {/* Mobile User Info Sheet can be handled inside ChatWindow or here via overlay */}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      <ResizablePanelGroup direction="horizontal">

        {/* Left Panel: Conversation List */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="border-r border-border">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={(c) => {
              console.log('Conversation selected:', c._id, 'Unread count:', c.unreadCount);
              setSelectedConversation(c);
              // Immediately refresh conversations to update unread counts
              // This ensures the badge updates even if socket events are delayed
              setTimeout(() => {
                console.log('Refreshing conversations after selection...');
                fetchConversations();
              }, 500);
            }}
            isLoading={isLoading}
            onTabChange={handleTabChange}
            onRefresh={fetchConversations}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Middle Panel: Chat Window */}
        <ResizablePanel defaultSize={showUserInfo ? 50 : 75} minSize={30}>
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              onBack={() => setSelectedConversation(null)}
              onUpdate={() => fetchConversations()}
              onToggleInfo={toggleUserInfo}
              onConversationRead={handleConversationRead}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a conversation to start chatting</p>
            </div>
          )}
        </ResizablePanel>

        {/* Right Panel: User Info */}
        {selectedConversation && showUserInfo && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={30} className="border-l border-border">
              <UserInfoPanel
                conversation={selectedConversation}
                onClose={() => setShowUserInfo(false)}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Floating Toggle for Info Panel if closed and chat selected? 
          Ideally ChatWindow header has the button. 
          Assuming ChatWindow has the button and we pass a handler.
          For now, I'll update ChatWindow next to accept onToggleInfo.
      */}
    </div>
  );
};
