process.env.TZ = 'Asia/Kolkata'
import { setServers } from "node:dns/promises";

setServers(["1.1.1.1", "8.8.8.8"]);
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorMiddleware';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import authRoutes from './routes/authRoutes';

const app = express();

// 1. Global Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow the exact CLIENT_URL (which has no trailing slash now)
    if (origin === env.CLIENT_URL) {
      return callback(null, true);
    }
    
    // Allow localhost during development
    if (env.NODE_ENV === 'development' && origin.startsWith('http://localhost')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Prevent HTTP parameter pollution
app.use(hpp());

import mongoose from 'mongoose';

// 2. Database Connection
mongoose.connect(env.MONGODB_URI)
  .then(() => console.log('📦 Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 3. Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/webhook', authRoutes)
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

// 4. Register Cron Jobs
import { registerJobs } from './jobs/cronJobs';
registerJobs();

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    timezone: process.env.TZ 
  });
});

// 5. Global Error Handler (must be the last middleware)
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});
