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
  const [showUserInfo, setShowUserInfo] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ============================================================
  // FETCH CONVERSATIONS
  // ============================================================

  const fetchConversations = async (includeArchived = false) => {
    setIsLoading(true);

    try {
      console.log(
        '[ChatDashboard] Fetching conversations, includeArchived:',
        includeArchived
      );

      const response = await api.getConversations(includeArchived);

      const convs = response.data.conversations || [];

      console.log(
        '[ChatDashboard] Fetched conversations:',
        convs.length
      );

      convs.forEach((c: any) => {
        console.log(
          `  - ${
            c.groupName ||
            c.participants?.find(
              (p: any) => p._id !== user?._id
            )?.name ||
            'Unknown'
          }: unread=${c.unreadCount}`
        );
      });

      setConversations(convs);
    } catch (error) {
      console.error(
        '[ChatDashboard] Failed to fetch conversations:',
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // INITIAL FETCH
  // ============================================================

  useEffect(() => {
    fetchConversations();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ============================================================
  // HANDLE CONVERSATION ID FROM NAVIGATION
  // ============================================================

  useEffect(() => {
    const state = location.state as any;

    if (state?.conversationId && conversations.length > 0) {
      const conversation = conversations.find(
        c => c._id === state.conversationId
      );

      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [location.state, conversations]);

  // ============================================================
  // SOCKET LISTENERS
  // ============================================================

  useEffect(() => {
    if (!socket) return;

    // ----------------------------------------------------------
    // New conversation created
    // ----------------------------------------------------------

    const handleConversationCreated = (data: any) => {
      console.log(
        '[ChatDashboard] New conversation created:',
        data
      );

      // A new conversation actually changes the conversation list,
      // so refreshing here is appropriate.
      fetchConversations();
    };

    // ----------------------------------------------------------
    // Conversations updated
    // ----------------------------------------------------------

    const handleConversationsUpdated = (data: any) => {
      console.log(
        '[ChatDashboard] Conversations updated from socket'
      );

      setConversations(data.conversations || []);
    };

    // ----------------------------------------------------------
    // Request accepted
    // ----------------------------------------------------------

    const handleRequestAccepted = (data: any) => {
      console.log(
        '[ChatDashboard] Request accepted:',
        data
      );

      // A request acceptance can create a new conversation,
      // so refresh the conversation list.
      fetchConversations();
    };

    // ----------------------------------------------------------
    // Messages marked as read
    // ----------------------------------------------------------

    const handleMessagesRead = (data: any) => {
      console.log(
        '[ChatDashboard] Messages marked as read:',
        data
      );

      /*
       * IMPORTANT:
       * Previously this called fetchConversations().
       *
       * That caused an unnecessary GET /chat/conversations
       * every time messages were marked as read.
       *
       * We now update the unread count locally.
       */

      if (data?.conversationId) {
        setConversations(prevConversations =>
          prevConversations.map(conversation =>
            conversation._id === data.conversationId
              ? {
                  ...conversation,
                  unreadCount: 0
                }
              : conversation
          )
        );
      }
    };

    // ----------------------------------------------------------
    // New message
    // ----------------------------------------------------------

    const handleNewMessage = (data: any) => {
      console.log(
        '[ChatDashboard] New message received:',
        data
      );

      /*
       * Keep this refresh for now because a new message can
       * change the preview, timestamp and unread count.
       *
       * We can optimize this later if necessary.
       */
      fetchConversations();
    };

    // Register listeners
    socket.on(
      'conversation-created',
      handleConversationCreated
    );

    socket.on(
      'conversations-updated',
      handleConversationsUpdated
    );

    socket.on(
      'request-accepted',
      handleRequestAccepted
    );

    socket.on(
      'messages-read',
      handleMessagesRead
    );

    socket.on(
      'new-message',
      handleNewMessage
    );

    // Cleanup listeners
    return () => {
      socket.off(
        'conversation-created',
        handleConversationCreated
      );

      socket.off(
        'conversations-updated',
        handleConversationsUpdated
      );

      socket.off(
        'request-accepted',
        handleRequestAccepted
      );

      socket.off(
        'messages-read',
        handleMessagesRead
      );

      socket.off(
        'new-message',
        handleNewMessage
      );
    };
  }, [socket]);

  // ============================================================
  // CONVERSATION MARKED AS READ
  // ============================================================

  const handleConversationRead = (
    conversationId: string
  ) => {
    console.log(
      '[ChatDashboard] Conversation marked as read:',
      conversationId
    );

    /*
     * Update unread count locally.
     *
     * DO NOT call fetchConversations() here.
     *
     * This prevents:
     *
     * mark-read
     *      ↓
     * fetch conversations
     *      ↓
     * messages-read
     *      ↓
     * fetch conversations again
     *
     * which was contributing to the 429 problem.
     */

    setConversations(prevConversations =>
      prevConversations.map(conversation =>
        conversation._id === conversationId
          ? {
              ...conversation,
              unreadCount: 0
            }
          : conversation
      )
    );
  };

  // ============================================================
  // TAB CHANGE
  // ============================================================

  const handleTabChange = (tab: string) => {
    if (tab === 'archived') {
      fetchConversations(true);
    } else {
      /*
       * The "all" and "unread" tabs are subsets of the active
       * conversation list, so they don't need separate API calls.
       *
       * When returning from archived, we fetch active conversations.
       */
      fetchConversations(false);
    }
  };

  // ============================================================
  // TOGGLE USER INFO
  // ============================================================

  const toggleUserInfo = () => {
    setShowUserInfo(!showUserInfo);
  };

  // ============================================================
  // MOBILE LAYOUT
  // ============================================================

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">

        {!selectedConversation ? (
          <div className="flex-1 overflow-hidden">

            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}

              onSelectConversation={(conversation) => {
                console.log(
                  'Conversation selected (mobile):',
                  conversation._id,
                  'Unread count:',
                  conversation.unreadCount
                );

                /*
                 * IMPORTANT:
                 * We no longer call fetchConversations()
                 * after selecting a conversation.
                 */
                setSelectedConversation(conversation);
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

              onBack={() => {
                setSelectedConversation(null);
              }}

              onUpdate={() => {
                /*
                 * ChatWindow can still explicitly request an update
                 * when it actually needs one.
                 */
                fetchConversations();
              }}

              onConversationRead={handleConversationRead}
            />

          </div>
        )}

      </div>
    );
  }

  // ============================================================
  // DESKTOP LAYOUT
  // ============================================================

  return (
    <div className="h-screen bg-background overflow-hidden">

      <ResizablePanelGroup direction="horizontal">

        {/* ======================================================
            LEFT PANEL - CONVERSATION LIST
        ====================================================== */}

        <ResizablePanel
          defaultSize={25}
          minSize={20}
          maxSize={35}
          className="border-r border-border"
        >

          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}

            onSelectConversation={(conversation) => {
              console.log(
                'Conversation selected:',
                conversation._id,
                'Unread count:',
                conversation.unreadCount
              );

              /*
               * IMPORTANT:
               * Removed the 500ms fetchConversations() call.
               *
               * ChatWindow will handle marking the conversation
               * as read.
               */
              setSelectedConversation(conversation);
            }}

            isLoading={isLoading}
            onTabChange={handleTabChange}
            onRefresh={fetchConversations}
          />

        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* ======================================================
            MIDDLE PANEL - CHAT WINDOW
        ====================================================== */}

        <ResizablePanel
          defaultSize={showUserInfo ? 50 : 75}
          minSize={30}
        >

          {selectedConversation ? (

            <ChatWindow
              conversation={selectedConversation}

              onBack={() => {
                setSelectedConversation(null);
              }}

              onUpdate={() => {
                /*
                 * Keep this callback because ChatWindow may
                 * explicitly request a conversation refresh.
                 */
                fetchConversations();
              }}

              onToggleInfo={toggleUserInfo}

              onConversationRead={handleConversationRead}
            />

          ) : (

            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/20">

              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />

              <p className="text-lg font-medium">
                Select a conversation to start chatting
              </p>

            </div>

          )}

        </ResizablePanel>

        {/* ======================================================
            RIGHT PANEL - USER INFO
        ====================================================== */}

        {selectedConversation && showUserInfo && (
          <>

            <ResizableHandle withHandle />

            <ResizablePanel
              defaultSize={25}
              minSize={20}
              maxSize={30}
              className="border-l border-border"
            >

              <UserInfoPanel
                conversation={selectedConversation}
                onClose={() => setShowUserInfo(false)}
              />

            </ResizablePanel>

          </>
        )}

      </ResizablePanelGroup>

    </div>
  );
};