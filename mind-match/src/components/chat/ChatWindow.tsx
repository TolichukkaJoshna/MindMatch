import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MoreVertical,
  Archive, BellOff, Bell, Info, Sidebar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePresence } from '@/contexts/PresenceContext';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';

interface ChatWindowProps {
  conversation: any;
  onBack: () => void;
  onUpdate: () => void;
  onToggleInfo?: () => void;
  onConversationRead?: (conversationId: string) => void;
}

export const ChatWindow = ({ conversation, onBack, onUpdate, onToggleInfo, onConversationRead }: ChatWindowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isUserOnline } = usePresence();
  const { socket, joinConversation } = useSocket();

  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(conversation.isMuted || false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    setIsMuted(conversation.isMuted || false);
  }, [conversation._id]);

  // Socket listeners for real-time messages
  useEffect(() => {
    if (!socket || !conversation._id) return;

    // Join the conversation room
    joinConversation(conversation._id);

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      if (data.message?.conversationId === conversation._id) {
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(m => m._id === data.message._id);
          if (exists) return prev;
          return [...prev, data.message];
        });
        setTimeout(scrollToBottom, 100);
      }
    };

    // Listen for messages being read by other participants
    const handleMessagesRead = (data: any) => {
      if (data.conversationId === conversation._id) {
        // Update messages to reflect they've been seen
        setMessages(prev => prev.map(msg => {
          // If this is our message and it hasn't been seen by this user yet
          if (msg.senderId?._id === user?._id || msg.senderId === user?._id) {
            const alreadySeen = msg.seenBy?.some(
              (s: any) => s.userId?._id === data.userId || s.userId === data.userId
            );
            if (!alreadySeen) {
              return {
                ...msg,
                seenBy: [...(msg.seenBy || []), { userId: data.userId, seenAt: new Date() }],
                deliveryStatus: 'delivered'
              };
            }
          }
          return msg;
        }));
      }
    };


    socket.on('new-message', handleNewMessage);
    socket.on('messages-read', handleMessagesRead);

    // Mark messages as read when opening conversation - using API call
    const markAsRead = async () => {
      try {
        console.log('ChatWindow: Marking conversation as read via API:', conversation._id);
        await api.markConversationAsRead(conversation._id);
        console.log('ChatWindow: Successfully marked as read');
        // Notify parent to refresh conversation list
        if (onConversationRead) {
          onConversationRead(conversation._id);
        }
      } catch (error) {
        console.error('ChatWindow: Error marking as read:', error);
        // Fallback to socket event if API fails
        socket.emit('mark-read', { conversationId: conversation._id });
      }
    };

    markAsRead();

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('messages-read', handleMessagesRead);
    };
  }, [socket, conversation._id, joinConversation, user?._id]);


  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await api.getMessages(conversation._id);
      setMessages(response.data.messages || []);
      // Scroll to bottom after a short delay to ensure rendering
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMuteToggle = async () => {
    try {
      await api.toggleMuteConversation(conversation._id);
      setIsMuted(!isMuted);
      toast({
        title: 'Success',
        description: isMuted ? 'Conversation unmuted' : 'Conversation muted',
      });
      onUpdate();
    } catch (error) {
      // Error handled
    }
  };

  const handleArchive = async () => {
    try {
      await api.toggleArchiveConversation(conversation._id);
      toast({
        title: 'Success',
        description: 'Conversation archived',
      });
      onUpdate();
      onBack();
    } catch (error) {
      // Error handled
    }
  };

  const getConversationName = () => {
    if (conversation.groupName) return conversation.groupName;
    if (conversation.participants && conversation.participants.length > 0) {
      // Find the other user (not the current user)
      const otherParticipant = conversation.participants.find(
        (p: any) => p._id !== user?._id
      );
      return otherParticipant?.name || 'Unknown';
    }
    return 'Conversation';
  };

  const getOtherUser = () => {
    if (conversation.isGroup) return null;
    // Find the other user (not the current user)
    return conversation.participants?.find((p: any) => p._id !== user?._id);
  };

  const otherUser = getOtherUser();
  const isOnline = otherUser ? isUserOnline(otherUser._id) : false;

  const getInitials = (name: string) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const getMatchScore = () => {
    // Ensure matchScore exists on the conversation or participant
    if (conversation.matchScore) return conversation.matchScore;
    // Or maybe on the participant?
    return null;
  };

  const matchScore = getMatchScore();

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-background/80 supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Avatar className="w-10 h-10 border border-border">
            <AvatarImage src={conversation.groupAvatar || otherUser?.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(getConversationName())}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm md:text-base">{getConversationName()}</h2>
              {matchScore && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  {matchScore}% Match
                </Badge>
              )}
            </div>
            {isOnline ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {otherUser?.title || 'Student'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onToggleInfo && (
            <Button variant="ghost" size="icon" onClick={onToggleInfo} className="text-muted-foreground hover:text-foreground">
              <Sidebar className="w-5 h-5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onToggleInfo} className="md:hidden">
                <Info className="w-4 h-4 mr-2" />
                View Info
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleMuteToggle}>
                {isMuted ? (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Unmute
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Mute
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        currentUserId={user?._id}
        onRefresh={fetchMessages}
      // TODO: Pass socket instance or handler for real-time appends if not handled globally
      />

      {/* Message Composer */}
      <MessageComposer
        conversationId={conversation._id}
        onMessageSent={() => {
          fetchMessages();
          onUpdate();
        }}
      />

      <div ref={messagesEndRef} />
    </div>
  );
};
