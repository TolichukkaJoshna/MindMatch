import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, Trash2, Calendar, UserPlus, MessageSquare, Info
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/useSocket';

interface Notification {
  id: string;
  type: 'message' | 'request' | 'request-accepted' | 'conversation' | 'meeting' | 'info';
  text: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
  data?: any;
}

export const NotificationCenter = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'request': return 'New Connection Request';
      case 'request-accepted': return 'Request Accepted';
      case 'conversation': return 'New Conversation';
      case 'message': return 'New Message';
      default: return 'Notification';
    }
  };

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show toast notification
    toast({
      title: getNotificationTitle(notification.type),
      description: notification.text,
    });
  }, [toast]);

  // Socket listeners for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (data: any) => {
      addNotification({
        id: `req-${Date.now()}`,
        type: 'request',
        text: `${data.request?.from?.name || 'Someone'} sent you a connection request`,
        createdAt: new Date(),
        read: false,
        actionUrl: '/dashboard?tab=requests',
      });
    };

    const handleRequestAccepted = (data: any) => {
      addNotification({
        id: `acc-${Date.now()}`,
        type: 'request-accepted',
        text: `${data.acceptedBy || 'Someone'} accepted your connection request!`,
        createdAt: new Date(),
        read: false,
        actionUrl: '/chat',
        data: { conversationId: data.conversationId },
      });
    };

    const handleConversationCreated = (data: any) => {
      const otherUser = data.conversation?.participants?.find((p: any) => p._id !== socket.id);
      addNotification({
        id: `conv-${Date.now()}`,
        type: 'conversation',
        text: `You can now chat with ${otherUser?.name || 'your new connection'}`,
        createdAt: new Date(),
        read: false,
        actionUrl: '/chat',
        data: { conversationId: data.conversation?._id },
      });
    };

    socket.on('new-request', handleNewRequest);
    socket.on('request-accepted', handleRequestAccepted);
    socket.on('conversation-created', handleConversationCreated);

    return () => {
      socket.off('new-request', handleNewRequest);
      socket.off('request-accepted', handleRequestAccepted);
      socket.off('conversation-created', handleConversationCreated);
    };
  }, [socket, addNotification]);


  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      // For now, keep existing notifications from state
      // In production, fetch from backend API
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setIsOpen(false);

    if (notification.actionUrl) {
      if (notification.data?.conversationId) {
        navigate(notification.actionUrl, {
          state: { conversationId: notification.data.conversationId }
        });
      } else {
        navigate(notification.actionUrl);
      }
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'request': return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'request-accepted': return <Check className="w-4 h-4 text-green-600" />;
      case 'conversation': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'meeting': return <Calendar className="w-4 h-4 text-purple-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div key={notification.id} className={`p-4 flex gap-3 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}>
                  <div className="mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-none">{notification.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => markAsRead(notification.id)}>
                      <Check className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
