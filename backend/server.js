import './config/loadEnv.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import connectDB from "./config/db.js";
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';

import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
const PORT = process.env.PORT;

// Initialize Database
await connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware({
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
  authorizedParties: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000'],
  debug: true
}));

// Serve static assets in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/domains/:domain/resources', resourceRoutes);
app.use('/api/domains/:domain/announcements', announcementRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// Fallback to React app index.html for client-side routing in production (ignoring /api)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});