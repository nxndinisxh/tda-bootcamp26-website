import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

import authRouter from './routes/auth.js';
import resourcesRouter from './routes/resources.js';
import announcementsRouter from './routes/announcements.js';
import leaderboardRouter from './routes/leaderboard.js';
import adminRouter from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dotenv relative to this file
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Lazy database connection middleware for serverless robustness
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection middleware error:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/domains', resourcesRouter);
app.use('/api/domains', announcementsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/admin', adminRouter);

// Serve static assets in production
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// Fallback to React app index.html for client-side routing in production (ignoring /api)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

export default app;