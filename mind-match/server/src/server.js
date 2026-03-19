import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Database
import connectDB from './config/database.js';
import { initializeRedis } from './config/redis.js';
import { initializeSocket, getIO } from './config/socket.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import skillRoutes from './routes/skills.js';
import matchRoutes from './routes/matches.js';
import requestRoutes from './routes/requests.js';
import chatRoutes from './routes/chat.js';
import groupRoutes from './routes/groups.js';
import statusRoutes from './routes/status.js';
import resourceRoutes from './routes/resources.js';
import profileRoutes from './routes/profile.js';

// Middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Socket handlers
import { setupChatHandlers } from './socket/chatHandler.js';
import { setupStatusHandlers } from './socket/statusHandler.js';

// Jobs
import { startMatchingCron } from './jobs/matchingCron.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config - Load .env from server directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Express app
const app = express();
const server = createServer(app);

// Connect to database
connectDB();

// Initialize Redis (optional)
initializeRedis();

// Initialize Socket.io
const io = initializeSocket(server);

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.userId}`);

    // Set up chat handlers
    setupChatHandlers(io, socket);

    // Set up status handlers
    setupStatusHandlers(io, socket);

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.userId}`);
    });
});

// Middleware
app.use(helmet()); // Security headers
// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL] 
    : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all origins in development
        }
    },
    credentials: true,
}));
app.use(compression()); // Compress responses
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        database: {
            status: dbStatus,
            readyState: mongoose.connection.readyState,
        },
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/profile', profileRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start cron jobs
startMatchingCron();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎓 MindMatch Backend Server                            ║
║                                                           ║
║   🚀 Server running on port ${PORT}                        ║
║   📊 Environment: ${process.env.NODE_ENV || 'development'}                      ║
║   🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});

export default app;
