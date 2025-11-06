import * as dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction, Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import socketService from './services/socketService';

// 🧩 Import routes
import authRoutes from './routes/auth';
import postRoutes from './routes/post';
import uploadRoutes from './routes/upload';
import mediaRoutes from './routes/media';
import healthRoutes from './routes/health';
import userRoutes from './routes/user';

// 🧩 Import configs
import { connectDB } from './config/db';
import { db } from './config/firebaseConfig';

// 🧩 Kiểm tra Firebase config
console.log('🔄 Checking Firebase connection...');
try {
  console.log('✅ Firebase config loaded');
} catch (error) {
  console.log('❌ Firebase connection error:', error instanceof Error ? error.message : 'Unknown error');
}

// 🧩 Kiểm tra Cloudinary cấu hình
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn(
    '⚠️ Cloudinary not fully configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.'
  );
} else {
  console.log('✅ Cloudinary configuration detected');
}

// 🧩 Kết nối MongoDB
connectDB();

// 🧩 Khởi tạo app Express và HTTP server
const app: Application = express();
const httpServer = createServer(app);
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// 🧩 Khởi tạo Socket.IO
socketService.initialize(httpServer);

// 🧩 Middleware cấu hình CORS + session
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🧩 Định tuyến
app.use('/auth', authRoutes);
app.use('/post', postRoutes);
app.use('/upload', uploadRoutes);
app.use('/media', mediaRoutes);
app.use('/health', healthRoutes);
app.use('/user', userRoutes);

// 🧩 Cho phép phục vụ file uploads cục bộ (nếu được bật)
if (process.env.ALLOW_LOCAL_UPLOADS === 'true') {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  console.log('📂 Local uploads static serving ENABLED (ALLOW_LOCAL_UPLOADS=true)');
} else {
  console.log('☁️ Local uploads static serving DISABLED (files served from Firebase/Cloudinary)');
}

// 🧩 Endpoint test nhanh
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🚀 Backend server is running!',
    timestamp: new Date().toISOString(),
  });
});

// 🧩 Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Global error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 🧩 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// 🧩 Chạy server + verify email service
httpServer.listen(PORT, async () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO server running on http://localhost:${PORT}`);
  console.log(`📘 API Documentation available at http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    const { default: emailService } = await import('./services/emailService');
    await emailService.verifyConnection();
    console.log('✅ Email service connection verified');
  } catch (error) {
    console.error('❌ Email service verification failed:', error instanceof Error ? error.message : error);
  }
});
