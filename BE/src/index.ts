import postRoutes from './routes/post';
import * as dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import session from 'express-session';
import { db } from './config/firebaseConfig';
import authRoutes from './routes/auth';
import { connectDB } from './config/db';
// Initialize Firebase config
console.log('🔄 Checking Firebase connection...');
try {
  console.log('Firebase config loaded');
} catch (error) {
  console.log('Firebase connection error:', error instanceof Error ? error.message : 'Unknown error');
}
connectDB();
const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true, 
}));

app.use(session({
  secret: process.env.SESSION_SECRET || "supersecret", 
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' } 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes

import uploadRoutes from './routes/upload';
import path from 'path';
app.use('/auth', authRoutes);
app.use('/post', postRoutes);
app.use('/upload', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Test endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Backend server is running!',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Verify email service connection
  const { default: emailService } = await import('./services/emailService');
  await emailService.verifyConnection();
});
