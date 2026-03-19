import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
        },
        // Message Type
        messageType: {
            type: String,
            enum: ['text', 'file', 'code', 'voice', 'system', 'icebreaker'],
            default: 'text',
        },
        // Text Content
        text: {
            type: String,
            trim: true,
        },
        // File Attachments
        fileUrl: {
            type: String,
        },
        fileName: {
            type: String,
        },
        fileSize: {
            type: Number, // in bytes
        },
        fileType: {
            type: String,
            enum: ['image', 'video', 'document', 'audio', 'code', 'other', ''],
        },
        thumbnailUrl: {
            type: String, // For images/videos
        },
        // Code Snippet Data
        codeSnippet: {
            code: String,
            language: String,
            filename: String,
        },
        // Voice Message Data
        voiceMessage: {
            duration: Number, // in seconds
            waveform: [Number], // Audio waveform data for visualization
        },
        // Threading - Reply to another message
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        // Reactions
        reactions: [
            {
                emoji: String,
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            }
        ],
        // Message Status
        deliveryStatus: {
            type: String,
            enum: ['sending', 'sent', 'delivered', 'failed'],
            default: 'sent',
        },
        seenBy: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                seenAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        // Editing & Deletion
        isEdited: {
            type: Boolean,
            default: false,
        },
        editHistory: [
            {
                text: String,
                editedAt: {
                    type: Date,
                    default: Date.now,
                },
            }
        ],
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        // Starred Messages
        starredBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ],
        // Pinned Message
        isPinned: {
            type: Boolean,
            default: false,
        },
        pinnedAt: {
            type: Date,
        },
        pinnedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        // Metadata
        metadata: {
            icebreakerTemplate: String,
            systemMessageType: String, // For system messages like "User joined", "User left"
            mentionedUsers: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                }
            ],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ conversationId: 1, isPinned: 1 });
messageSchema.index({ 'starredBy': 1 });
messageSchema.index({ isDeleted: 1 });

// Virtual for checking if message is read by all participants
messageSchema.virtual('isReadByAll').get(function() {
    // This would need conversation participant count to determine
    return this.seenBy.length > 1; // Simplified
});

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
    // Remove existing reaction from this user with same emoji
    this.reactions = this.reactions.filter(
        r => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
    );
    
    // Add new reaction
    this.reactions.push({ userId, emoji });
    return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId, emoji) {
    this.reactions = this.reactions.filter(
        r => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
    );
    return this.save();
};

// Method to edit message
messageSchema.methods.editMessage = function(newText) {
    if (this.text) {
        this.editHistory.push({
            text: this.text,
            editedAt: new Date(),
        });
    }
    this.text = newText;
    this.isEdited = true;
    return this.save();
};

const Message = mongoose.model('Message', messageSchema);

export default Message;

