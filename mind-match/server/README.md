# MindMatch Backend

Production-grade backend system for MindMatch - an intelligent student networking platform.

## 🚀 Features

- **Authentication**: OTP-based email verification, JWT tokens, Google OAuth support
- **Smart Matching**: AI-powered matching algorithm based on skills, location, and goals
- **Real-time Chat**: WebSocket-based messaging with typing indicators and read receipts
- **Study Groups**: Create and join study groups with activity tracking
- **Resource Sharing**: Share and discover learning resources with upvote system
- **Live Status**: Real-time learning status updates
- **Analytics**: Track user behavior and generate insights

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Redis (optional, for caching)

## 🛠️ Installation

1. **Clone the repository** (if not already done)

2. **Navigate to server directory**
   ```bash
   cd server
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure environment variables**
   
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `EMAIL_USER`: Email for sending OTPs
   - `EMAIL_PASSWORD`: Email password/app password

5. **Seed the database**
   ```bash
   npm run seed
   ```

## 🏃 Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Authentication
- `POST /api/auth/signup` - Register with email
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users
- `PUT /api/users/onboarding/skills` - Update skills
- `PUT /api/users/onboarding/goals` - Update goals
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar

### Matches
- `GET /api/matches/recommended` - Get recommended matches
- `POST /api/matches/refresh` - Refresh matches

### Study Requests
- `POST /api/requests/send` - Send study request
- `GET /api/requests/received` - Get received requests
- `GET /api/requests/sent` - Get sent requests
- `PUT /api/requests/:id/accept` - Accept request
- `PUT /api/requests/:id/reject` - Reject request

### Chat
- `GET /api/chat/conversations` - Get conversations
- `POST /api/chat/conversation` - Create conversation
- `GET /api/chat/:conversationId/messages` - Get messages

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups/recommended` - Get recommended groups
- `GET /api/groups/my-groups` - Get user's groups
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/leave` - Leave group

### Status
- `POST /api/status` - Update learning status
- `GET /api/status/feed` - Get status feed
- `DELETE /api/status` - Delete status

### Resources
- `POST /api/resources` - Post resource
- `GET /api/resources` - Get resources
- `GET /api/resources/top` - Get top resources
- `POST /api/resources/:id/upvote` - Upvote resource
- `POST /api/resources/:id/downvote` - Downvote resource

## 🔌 WebSocket Events

### Chat Events
- `join-conversation` - Join a conversation room
- `send-message` - Send a message
- `new-message` - Receive new message
- `typing` - Send typing indicator
- `user-typing` - Receive typing indicator
- `mark-read` - Mark messages as read

### Status Events
- `subscribe-status` - Subscribe to status updates
- `status-updated` - Receive status update

## 🏗️ Project Structure

```
server/
├── src/
│   ├── config/         # Configuration files
│   ├── models/         # Mongoose models
│   ├── controllers/    # Route controllers
│   ├── services/       # Business logic
│   ├── middleware/     # Custom middleware
│   ├── routes/         # API routes
│   ├── socket/         # WebSocket handlers
│   ├── jobs/           # Cron jobs
│   ├── utils/          # Utility functions
│   └── server.js       # Main entry point
├── uploads/            # File uploads
├── .env                # Environment variables
└── package.json        # Dependencies
```

## 🔐 Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation and sanitization
- CORS protection
- Helmet security headers
- College email validation

## 📊 Performance Optimization

- MongoDB indexing
- Redis caching (optional)
- Response compression
- Batch processing for matches
- Efficient database queries

## 🤝 Contributing

1. Follow the existing code structure
2. Write meaningful commit messages
3. Test your changes thoroughly
4. Update documentation as needed

## 📝 License

MIT License

## 👥 Support

For issues or questions, please contact the development team.
