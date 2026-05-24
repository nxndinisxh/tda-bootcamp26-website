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

import apiLimiter from './middleware/apiLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dotenv relative to this file
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database
await connectDB();

app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(apiLimiter); // api limiter to all routes

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

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});