const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const moodRoutes = require('./routes/mood');
const recipeRoutes = require('./routes/recipe');
const geminiRoutes = require('./routes/gemini');

// CORS configuration - UPDATED FOR FRONTEND
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', // Vite default port
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'MoodMenu API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'MoodMenu API is healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/recipe', recipeRoutes);
app.use('/api/gemini', geminiRoutes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error : {}
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`
  });
});

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 MoodMenu API Server running on port ${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;