import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Code2, Smile, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';
import { CodeSnippetEditor } from './CodeSnippetEditor';
import { FileUploadManager } from './FileUploadManager';
import { MeetingScheduler } from './MeetingScheduler';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import api from '@/lib/api';

interface MessageComposerProps {
  conversationId: string;
  onMessageSent: () => void;
}

export const MessageComposer = ({ conversationId, onMessageSent }: MessageComposerProps) => {
  const { toast } = useToast();
  const { sendMessage, sendTyping } = useSocket();
  const { user } = useAuth();
  
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      // Call API to persist message - backend will emit socket event
      await api.sendMessage(conversationId, {
        text: message.trim(),
        messageType: 'text'
      });

      setMessage('');
      onMessageSent(); // Triggers parent to refresh messages
      
      // Stop typing indicator
      sendTyping(conversationId, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      // Reset textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;

    // Typing indicator logic
    sendTyping(conversationId, true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(conversationId, false);
    }, 2000);
  };

  const handleFeatureNotReady = (feature: string) => {
    toast({
      title: 'Coming Soon',
      description: `${feature} feature will be available soon`,
    });
  };

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className="flex items-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="shrink-0">
              <Paperclip className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top">
            <DropdownMenuItem onClick={() => setShowFileUpload(true)}>
              <Paperclip className="w-4 h-4 mr-2" />
              Attach File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCodeEditor(true)}>
              <Code2 className="w-4 h-4 mr-2" />
              Code Snippet
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowMeetingScheduler(true)}>
              <Mic className="w-4 h-4 mr-2" />
              Schedule Meeting
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-[200px] resize-none pr-10"
            rows={1}
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 bottom-2 h-8 w-8 p-0"
          >
            <Smile className="w-5 h-5" />
          </Button>
        </div>

        <Button
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          className="shrink-0"
          size="sm"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
      <CodeSnippetEditor 
        open={showCodeEditor}
        onOpenChange={setShowCodeEditor}
        onSend={async (code, language) => {
          try {
            await api.sendMessage(conversationId, {
              text: code,
              messageType: 'code',
              codeSnippet: { code, language }
            });
            onMessageSent();
            setShowCodeEditor(false);
          } catch (error) {
            toast({
              title: 'Error',
              description: 'Failed to send code snippet',
              variant: 'destructive',
            });
          }
        }}
      />

      <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
        <DialogContent>
           <FileUploadManager 
              onUpload={async (file) => {
                 try {
                     const response = await api.uploadFile(file);
                     if (response.success && response.data) {
                         await api.sendMessage(conversationId, {
                             text: `Shared a file: ${response.data.filename || file.name}`,
                             messageType: 'file',
                             fileUrl: response.data.url,
                             fileType: response.data.type,
                             fileName: response.data.filename || file.name
                         });
                         onMessageSent();
                         setShowFileUpload(false);
                         return response.data.url;
                     }
                     throw new Error('Upload failed');
                 } catch (e) {
                     toast({
                       title: 'Error',
                       description: 'Failed to upload file',
                       variant: 'destructive',
                     });
                     throw e;
                 }
              }}
              onCancel={() => setShowFileUpload(false)}
           />
        </DialogContent>
      </Dialog>

      <MeetingScheduler
        open={showMeetingScheduler}
        onOpenChange={setShowMeetingScheduler}
        onSchedule={async (details) => {
          try {
            await api.sendMessage(conversationId, {
              text: `📅 Scheduled: ${details.title}\nDate: ${details.date.toLocaleString()}\nDuration: ${details.duration} min`,
              messageType: 'text',
            });
            onMessageSent();
            setShowMeetingScheduler(false);
          } catch (error) {
            toast({
              title: 'Error',
              description: 'Failed to schedule meeting',
              variant: 'destructive',
            });
          }
        }}
      />
    </div>
  );
};
