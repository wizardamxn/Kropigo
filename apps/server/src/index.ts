process.env.TZ = 'Asia/Kolkata'
import { setServers } from "node:dns/promises";

setServers(["1.1.1.1", "8.8.8.8"]);
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorMiddleware';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/authRoutes';
import { apiLimiter } from './middleware/rateLimiter';

const app = express();
const httpServer = createServer(app);

// ─── Socket.io Setup ──────────────────────────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin === env.CLIENT_URL) return callback(null, true);
      if (env.NODE_ENV === 'development' && origin.startsWith('http://localhost')) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

// Socket authentication middleware — reads the httpOnly cookie
io.use((socket, next) => {
  try {
    // Try to get token from cookies (httpOnly cookie sent by the browser)
    const rawCookies = socket.handshake.headers.cookie || '';
    const cookieMap: Record<string, string> = {};
    rawCookies.split(';').forEach((c) => {
      const [k, ...v] = c.trim().split('=');
      if (k) cookieMap[k.trim()] = decodeURIComponent(v.join('='));
    });
    const token = cookieMap['token'] || socket.handshake.auth.token;

    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket connection handler + rooms
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  const role = socket.data.role;

  // Each user joins their own personal room by userId
  socket.join(userId);

  // Everyone also joins their role room so role-targeted broadcasts
  // (admin_room / kisan_room / buyer_room) reach them.
  if (role) {
    socket.join(`${role}_room`);
  }

  console.log(`Socket connected: ${userId} | role: ${role}`);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${userId}`);
  });
});

// ─── Express Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin === env.CLIENT_URL) return callback(null, true);
    if (env.NODE_ENV === 'development' && origin.startsWith('http://localhost')) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(hpp());
app.use('/api/v1', apiLimiter);

import mongoose from 'mongoose';

// ─── Database ─────────────────────────────────────────────────────────────────
mongoose.connect(env.MONGODB_URI)
  .then(() => console.log('📦 Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);

import userRoutes from './routes/userRoutes';
app.use('/api/v1/user', userRoutes);

import listingRoutes from './routes/listing.routes';
app.use('/api/v1/listings', listingRoutes);

import mediaRoutes from './routes/media.routes';
app.use('/api/v1/media', mediaRoutes);

import mandiRateRoutes from './routes/mandiRate.routes';
app.use('/api/v1/mandi-rates', mandiRateRoutes);

import cropRoutes from './routes/crop.routes';
app.use('/api/v1/crops', cropRoutes);

import interestRoutes from './routes/interest.routes';
app.use('/api/v1/interests', interestRoutes);

import orderRoutes from './routes/order.routes';
app.use('/api/v1/orders', orderRoutes);

import notificationRoutes from './routes/notification.routes';
app.use('/api/v1/notifications', notificationRoutes);

// ─── Cron Jobs ────────────────────────────────────────────────────────────────
import { registerJobs } from './jobs/cronJobs';
registerJobs();

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    timezone: process.env.TZ,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

httpServer.listen(env.PORT, () => {
  console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});
