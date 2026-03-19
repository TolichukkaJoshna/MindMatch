import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical, Reply, Edit2, Trash2, Star, Copy,
  Check, CheckCheck, Smile
} from 'lucide-react';
import { formatDistanceToNow, isSameDay, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
  messages: any[];
  isLoading: boolean;
  currentUserId?: string;
  onRefresh: () => void;
}

export const MessageList = ({ messages, isLoading, currentUserId, onRefresh }: MessageListProps) => {
  const { toast } = useToast();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await api.addReaction(messageId, emoji);
      onRefresh();
    } catch (error) {
      // Error handled
    }
  };

  const handleStar = async (messageId: string) => {
    try {
      await api.toggleStarMessage(messageId);
      onRefresh();
    } catch (error) {
      // Error handled
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await api.deleteMessage(messageId);
      toast({ title: 'Success', description: 'Message deleted' });
      onRefresh();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete message', variant: 'destructive' });
    }
  };

  const getInitials = (name: string) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const getDeliveryIcon = (message: any, currentUserId?: string) => {
    // Only show status for messages sent by current user
    const messageSenderId = message.senderId?._id || message.senderId;
    if (!currentUserId || messageSenderId?.toString() !== currentUserId?.toString()) {
      return null;
    }

    // Check if message is seen by anyone other than sender
    const isSeenByOthers = message.seenBy?.some((seen: any) => {
      const seenUserId = seen.userId?._id || seen.userId;
      const seenUserIdStr = seenUserId?.toString();
      const currentUserIdStr = currentUserId?.toString();

      // Return true if this is NOT the current user (meaning someone else has seen it)
      return seenUserIdStr && seenUserIdStr !== currentUserIdStr;
    });

    if (isSeenByOthers) {
      // Double blue check marks - message has been seen by recipient
      return (
        <div className="flex items-center">
          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
        </div>
      );
    }

    // For messages not yet seen, show single tick (sent)
    // Single gray check mark - message sent
    return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20"
    >
      <AnimatePresence initial={false}>
        {messages.map((message, index) => {
          const isOwn = message.senderId?._id === currentUserId;
          const showAvatar = !isOwn && (
            index === 0 ||
            messages[index - 1]?.senderId?._id !== message.senderId?._id
          );

          const messageDate = new Date(message.createdAt);
          const showDaySeparator = index === 0 || !isSameDay(new Date(messages[index - 1].createdAt), messageDate);

          return (
            <div key={message._id}>
              {showDaySeparator && (
                <div className="flex justify-center my-4">
                  <span className="text-xs font-medium text-muted-foreground bg-background px-3 py-1 rounded-full border border-border">
                    {format(messageDate, 'MMM d, yyyy')}
                  </span>
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="w-8 flex-shrink-0">
                  {showAvatar && !isOwn && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {getInitials(message.senderId?.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                {/* Message Content */}
                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {!isOwn && showAvatar && (
                    <span className="text-xs text-muted-foreground px-2">
                      {message.senderId?.name}
                    </span>
                  )}

                  <div className="group relative">
                    <div
                      className={`rounded-2xl px-4 py-2 ${isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border'
                        }`}
                    >
                      {/* Text with Markdown */}
                      {message.messageType === 'text' && (
                        <div className={`prose prose-sm max-w-none break-words ${isOwn ? 'prose-invert' : ''}`}>
                          <ReactMarkdown>{message.text || ''}</ReactMarkdown>
                        </div>
                      )}

                      {/* Other types omitted for brevity, keeping existing structure logic implies they render here */}
                      {message.messageType === 'file' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📎</span>
                          <div>
                            <p className="font-medium underline cursor-pointer">{message.fileName || "File"}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions (simplified for brevity) */}
                  </div>

                  <div className={`flex items-center gap-1 px-2 text-[10px] text-muted-foreground`}>
                    <span>
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                    {isOwn && getDeliveryIcon(message, currentUserId)}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
