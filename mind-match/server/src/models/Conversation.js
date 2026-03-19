import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        // Conversation Type
        conversationType: {
            type: String,
            enum: ['direct', 'group', 'project'],
            default: 'direct',
        },
        // Group Information
        isGroup: {
            type: Boolean,
            default: false,
        },
        groupName: {
            type: String,
        },
        groupAvatar: {
            type: String,
        },
        groupDescription: {
            type: String,
        },
        groupAdmins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ],
        // Project Reference (for project-specific chats)
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
        },
        // Last Message
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        // Pinned Messages
        pinnedMessages: [
            {
                messageId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Message',
                },
                pinnedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                pinnedAt: {
                    type: Date,
                    default: Date.now,
                },
            }
        ],
        // User-specific Settings
        mutedBy: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                mutedUntil: {
                    type: Date, // null means muted indefinitely
                },
            }
        ],
        archivedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ],
        // Unread Count per User
        unreadCount: {
            type: Map,
            of: Number,
            default: {},
        },
        // Chat Settings
        chatSettings: {
            theme: {
                type: String,
                default: 'default',
            },
            wallpaper: String,
            notificationsEnabled: {
                type: Boolean,
                default: true,
            },
        },
        // Encryption (for future implementation)
        isEncrypted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ conversationType: 1 });
conversationSchema.index({ projectId: 1 });

// Method to check if user is participant
conversationSchema.methods.isParticipant = function (userId) {
    return this.participants.some(p => p.toString() === userId.toString());
};

// Method to check if user is admin (for groups)
conversationSchema.methods.isAdmin = function (userId) {
    if (!this.isGroup) return false;
    return this.groupAdmins.some(a => a.toString() === userId.toString());
};

// Method to increment unread count for users
conversationSchema.methods.incrementUnread = function (excludeUserId) {
    console.log(`[Conversation] Incrementing unread for conversation ${this._id}, excluding user ${excludeUserId}`);
    this.participants.forEach(participantId => {
        if (participantId.toString() !== excludeUserId.toString()) {
            const currentCount = this.unreadCount.get(participantId.toString()) || 0;
            this.unreadCount.set(participantId.toString(), currentCount + 1);
            console.log(`  - Set unread for ${participantId}: ${currentCount + 1}`);
        }
    });
    return this.save();
};

// Method to reset unread count for a user
conversationSchema.methods.resetUnread = function (userId) {
    const currentCount = this.unreadCount.get(userId.toString()) || 0;
    console.log(`[Conversation] Resetting unread for conversation ${this._id}, user ${userId}: ${currentCount} -> 0`);
    this.unreadCount.set(userId.toString(), 0);
    return this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;

