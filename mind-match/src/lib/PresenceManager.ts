import { Socket } from 'socket.io-client';

export type PresenceStatus = 'online' | 'offline' | 'idle' | 'away' | 'dnd';

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  customStatus?: string;
  lastSeen?: Date;
  isTyping?: boolean;
}

export class PresenceManager {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private currentStatus: PresenceStatus = 'offline';
  private customStatus: string = '';
  private idleTimeout: NodeJS.Timeout | null = null;
  private idleThreshold = 5 * 60 * 1000; // 5 minutes
  private lastActivity = Date.now();
  private presenceCache = new Map<string, UserPresence>();
  private listeners = new Set<(presences: Map<string, UserPresence>) => void>();

  constructor() {
    this.setupActivityListeners();
  }

  initialize(socket: Socket, userId: string) {
    this.socket = socket;
    this.userId = userId;
    this.setupSocketListeners();
    this.setStatus('online');
    this.startIdleDetection();
  }

  disconnect() {
    this.setStatus('offline');
    this.stopIdleDetection();
    this.socket = null;
    this.userId = null;
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    // Listen for presence updates from other users
    this.socket.on('presence:update', (data: UserPresence) => {
      this.presenceCache.set(data.userId, data);
      this.notifyListeners();
    });

    // Listen for bulk presence updates (on initial connect)
    this.socket.on('presence:bulk', (presences: UserPresence[]) => {
      presences.forEach(presence => {
        this.presenceCache.set(presence.userId, presence);
      });
      this.notifyListeners();
    });

    // Listen for user offline
    this.socket.on('user:offline', (data: { userId: string }) => {
      const presence = this.presenceCache.get(data.userId);
      if (presence) {
        presence.status = 'offline';
        presence.lastSeen = new Date();
        this.presenceCache.set(data.userId, presence);
        this.notifyListeners();
      }
    });
  }

  private setupActivityListeners() {
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      this.lastActivity = Date.now();
      
      // If user was idle or away, set back to online
      if (this.currentStatus === 'idle' || this.currentStatus === 'away') {
        this.setStatus('online');
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
  }

  private startIdleDetection() {
    this.idleTimeout = setInterval(() => {
      const idleTime = Date.now() - this.lastActivity;
      
      if (idleTime > this.idleThreshold && this.currentStatus === 'online') {
        this.setStatus('idle');
      }
    }, 60000); // Check every minute
  }

  private stopIdleDetection() {
    if (this.idleTimeout) {
      clearInterval(this.idleTimeout);
      this.idleTimeout = null;
    }
  }

  setStatus(status: PresenceStatus, customStatus?: string) {
    if (!this.socket || !this.userId) return;

    this.currentStatus = status;
    if (customStatus !== undefined) {
      this.customStatus = customStatus;
    }

    const presence: UserPresence = {
      userId: this.userId,
      status,
      customStatus: this.customStatus || undefined,
    };

    // Emit to server
    this.socket.emit('presence:update', presence);

    // Update local cache
    this.presenceCache.set(this.userId, presence);
    this.notifyListeners();
  }

  setCustomStatus(message: string) {
    this.customStatus = message;
    this.setStatus(this.currentStatus, message);
  }

  clearCustomStatus() {
    this.customStatus = '';
    this.setStatus(this.currentStatus, '');
  }

  setDoNotDisturb(enabled: boolean) {
    if (enabled) {
      this.setStatus('dnd');
    } else {
      this.setStatus('online');
    }
  }

  setAway(message?: string) {
    this.setStatus('away', message);
  }

  getPresence(userId: string): UserPresence | undefined {
    return this.presenceCache.get(userId);
  }

  getAllPresences(): Map<string, UserPresence> {
    return new Map(this.presenceCache);
  }

  isUserOnline(userId: string): boolean {
    const presence = this.presenceCache.get(userId);
    return presence?.status === 'online' || presence?.status === 'idle';
  }

  subscribe(callback: (presences: Map<string, UserPresence>) => void) {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.getAllPresences());
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const presences = this.getAllPresences();
    this.listeners.forEach(callback => callback(presences));
  }

  // Typing indicators
  startTyping(conversationId: string) {
    if (!this.socket || !this.userId) return;
    
    this.socket.emit('user:typing', {
      conversationId,
      userId: this.userId,
    });
  }

  stopTyping(conversationId: string) {
    if (!this.socket || !this.userId) return;
    
    this.socket.emit('user:stop-typing', {
      conversationId,
      userId: this.userId,
    });
  }
}

// Singleton instance
export const presenceManager = new PresenceManager();
