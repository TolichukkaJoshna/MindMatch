import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search,
  Plus,
  MessageSquare,
  Users,
  Archive,
  Star,
  BellOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { usePresence } from '@/contexts/PresenceContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { CreateGroupDialog } from './CreateGroupDialog';

interface ConversationListProps {
  conversations: any[];
  selectedConversation: any;
  onSelectConversation: (conversation: any) => void;
  isLoading: boolean;
  onTabChange?: (tab: string) => void;
  onRefresh?: () => void;
}

export const ConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  isLoading,
  onTabChange,
  onRefresh
}: ConversationListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const { isUserOnline } = usePresence();
  const { user } = useAuth();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  const getInitials = (name: string) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const getConversationName = (conv: any) => {
    if (conv.groupName) return conv.groupName;
    if (conv.participants && conv.participants.length > 0) {
      // Find the other user (not the current user)
      const otherParticipant = conv.participants.find(
        (p: any) => p._id !== user?._id
      );
      return otherParticipant?.name || 'Unknown';
    }
    return 'Conversation';
  };

  const getAvatar = (conv: any) => {
    if (conv.groupAvatar) return conv.groupAvatar;
    // Find the other user (not the current user)
    const otherParticipant = conv.participants?.find((p: any) => p._id !== user?._id);
    if (otherParticipant?.avatar) return otherParticipant.avatar;
    return null;
  };

  const isOnline = (conv: any) => {
    if (conv.isGroup) return false;
    // Find the other user (not the current user)
    const otherUser = conv.participants?.find((p: any) => p._id !== user?._id);
    return otherUser ? isUserOnline(otherUser._id) : false;
  };

  const getLastMessagePreview = (conv: any) => {
    if (!conv.lastMessage) return 'No messages yet';
    const msg = conv.lastMessage;
    // Handle population if lastMessage is object
    const text = typeof msg === 'string' ? 'Message' : (msg.text || 'Message');
    const type = typeof msg === 'object' ? msg.messageType : 'text';

    if (type === 'file') return '📎 File';
    if (type === 'code') return '💻 Code snippet';
    if (type === 'voice') return '🎤 Voice';
    return text;
  };

  const filteredConversations = useMemo(() => {
    // Parent might handle "Archived" fetching via onTabChange, 
    // but we also filter locally for other tabs
    return conversations.filter(conv => {
      // Search filter
      const name = getConversationName(conv).toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Tab filter
      switch (activeTab) {
        case 'unread':
          return (conv.unreadCount || 0) > 0;
        case 'groups':
          return conv.isGroup;
        case 'favorites':
          return false; // TODO: Implement favorites logic
        case 'archived':
          // If parent passes archived items in "conversations", this is fine.
          // If "archived" is a mode where only archived items are passed, then return true.
          // We'll rely on parent for "Archived" data usually.
          return true;
        default:
          return true;
      }
    });
  }, [conversations, searchQuery, activeTab]);

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 space-y-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Chats
          </h2>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
            onClick={() => setShowCreateGroupDialog(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-4 w-full h-9 bg-muted/50 p-1">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
            <TabsTrigger value="groups" className="text-xs">Groups</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
            <p>No conversations found</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            <AnimatePresence initial={false}>
              {filteredConversations.map((conv, index) => {
                const isSelected = selectedConversation?._id === conv._id;

                return (
                  <motion.div
                    key={conv._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectConversation(conv)}
                    className={cn(
                      "group p-3 rounded-lg cursor-pointer transition-all duration-200 border",
                      isSelected
                        ? "bg-primary/10 border-primary/10"
                        : (conv.unreadCount > 0)
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30 border-emerald-100/50 dark:border-emerald-900/30"
                          : "hover:bg-muted/50 border-transparent"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10 border border-border/50">
                          <AvatarImage src={getAvatar(conv)} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(getConversationName(conv))}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline(conv) && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className={cn(
                            "font-semibold text-sm truncate",
                            (conv.unreadCount > 0) && "text-foreground font-bold"
                          )}>
                            {getConversationName(conv)}
                          </h3>
                          {conv.lastMessage?.createdAt && (
                            <span className={cn(
                              "text-[10px]",
                              (conv.unreadCount > 0) ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"
                            )}>
                              {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            "text-xs truncate max-w-[140px]",
                            (conv.unreadCount > 0) ? "font-semibold text-foreground" : "text-muted-foreground"
                          )}>
                            {((conv.senderId === 'me' ? 'You: ' : '') + getLastMessagePreview(conv))}
                          </p>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Quick Actions helper can go here */}
                            {conv.isMuted && <BellOff className="w-3 h-3 text-muted-foreground" />}
                          </div>
                          {(conv.unreadCount > 0) && (
                            <Badge className="h-5 min-w-5 rounded-full px-1.5 flex items-center justify-center text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={showCreateGroupDialog}
        onOpenChange={setShowCreateGroupDialog}
        onGroupCreated={onRefresh}
      />
    </div>
  );
};
