const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || "https://ai-internship-hub-frontend.netlify.app", "http://localhost:3000"],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
const PORT = process.env.PORT || 3000;

// Make io accessible to routes
app.set('io', io);

// Security middleware with relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "https://ai-internship-hub-frontend.netlify.app", "http://localhost:5173", "ws://localhost:3000", "https://ai-internship-hub-backend.onrender.com"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"]
    }
  }
}));

// CORS configuration - Backend must configure CORS to explicitly allow requests from https://ai-internship-hub-frontend.netlify.app
app.use(cors({
  origin: [process.env.FRONTEND_URL || "https://ai-internship-hub-frontend.netlify.app", "http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware for JSON parsing errors
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('❌ JSON parsing error:', error.message);
    console.error('Request body:', req.body);
    return res.status(400).json({ error: 'Invalid JSON format: ' + error.message });
  }
  next();
});

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/internship_recommender', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1); // Exit if can't connect to database
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date() });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/company', require('./routes/companyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/internships', require('./routes/internshipRoutes'));
app.use('/api/recommendations', require('./routes/recommendations'));

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'register.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'student.html'));
});

app.get('/company', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'company.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'admin.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Join room based on user type
  socket.on('join', (data) => {
    if (data.userType === 'company' && data.companyId) {
      socket.join(`company_${data.companyId}`);
      console.log(`Company ${data.companyId} joined their room`);
    } else if (data.userType === 'student' && data.studentId) {
      socket.join(`student_${data.studentId}`);
      console.log(`Student ${data.studentId} joined their room`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🔌 Socket.IO enabled for real-time updates`);
  
  // Log important environment variables for debugging
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "https://ai-internship-hub-frontend.netlify.app"}`);
  console.log(`📡 Backend URL: https://ai-internship-hub-backend.onrender.com`);
});