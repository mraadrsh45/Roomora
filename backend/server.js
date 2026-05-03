require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');
const setupSocket = require('./src/utils/socket');

const authRoutes     = require('./src/routes/auth');
const userRoutes     = require('./src/routes/users');
const roomRoutes     = require('./src/routes/rooms');
const roommateRoutes = require('./src/routes/roommate');
const chatRoutes     = require('./src/routes/chat');
const adminRoutes    = require('./src/routes/admin');
const reportRoutes   = require('./src/routes/report');

const app = express();
const httpServer = http.createServer(app);

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
setupSocket(io);

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests' });
app.use('/api/', limiter);

// Routes
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/rooms',    roomRoutes);
app.use('/api/roommate', roommateRoutes);
app.use('/api/chat',     chatRoutes);
app.use('/api/report',   reportRoutes);
app.use('/api',          adminRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// Connect DB and start server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Roomora API running on http://localhost:${PORT}`);
  });
});

module.exports = app;
