import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Default initial database structure
const defaultDb = {
  users: [],
  resources: [],
  announcements: [],
  leaderboard: []
};

class Database {
  constructor() {
    this.data = null;
  }

  async init() {
    if (this.data) return;

    try {
      // Ensure the directory exists
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      
      try {
        const fileContent = await fs.readFile(DB_PATH, 'utf8');
        this.data = JSON.parse(fileContent);
      } catch (err) {
        // File doesn't exist or is invalid JSON
        this.data = { ...defaultDb };
        await this.save();
      }

      await this.seed();
    } catch (error) {
      console.error('Database initialization failed:', error);
      this.data = { ...defaultDb };
    }
  }

  async save() {
    if (!this.data) return;
    await fs.writeFile(DB_PATH, JSON.stringify(this.data, null, 2), 'utf8');
  }

  async seed() {
    let modified = false;

    // 1. Seed Super Admin if no users exist
    if (this.data.users.length === 0) {
      console.log('Seeding initial users...');
      const salt = await bcrypt.genSalt(10);
      const superAdminPasswordHash = await bcrypt.hash('admin123', salt);
      const userPasswordHash = await bcrypt.hash('user123', salt);
      const dsaAdminPasswordHash = await bcrypt.hash('dsa123', salt);

      // Super Admin
      this.data.users.push({
        id: 'user_super_admin',
        name: 'TDA Super Admin',
        email: 'admin@learner.manipal.edu',
        passwordHash: superAdminPasswordHash,
        domains: ['Machine Learning', 'Deep Learning', 'DAV', 'DSA', 'WebDev'],
        role: 'super_admin',
        adminDomains: ['Machine Learning', 'Deep Learning', 'DAV', 'DSA', 'WebDev'],
        createdAt: new Date().toISOString()
      });

      // Domain Admin (DSA Head)
      this.data.users.push({
        id: 'user_dsa_admin',
        name: 'Rohan Sharma',
        email: 'rohan.sharma@learner.manipal.edu',
        passwordHash: dsaAdminPasswordHash,
        domains: ['DSA'],
        role: 'admin',
        adminDomains: ['DSA'],
        createdAt: new Date().toISOString()
      });

      // Regular User 1
      this.data.users.push({
        id: 'user_1',
        name: 'Aditya Sen',
        email: 'aditya.sen@learner.manipal.edu',
        passwordHash: userPasswordHash,
        domains: ['DSA', 'WebDev', 'Machine Learning'],
        role: 'user',
        adminDomains: [],
        createdAt: new Date().toISOString()
      });

      // Regular User 2
      this.data.users.push({
        id: 'user_2',
        name: 'Neha Gupta',
        email: 'neha.gupta@learner.manipal.edu',
        passwordHash: userPasswordHash,
        domains: ['Machine Learning', 'Deep Learning'],
        role: 'user',
        adminDomains: [],
        createdAt: new Date().toISOString()
      });

      // Regular User 3
      this.data.users.push({
        id: 'user_3',
        name: 'Kabir Mehta',
        email: 'kabir.mehta@learner.manipal.edu',
        passwordHash: userPasswordHash,
        domains: ['DAV', 'WebDev'],
        role: 'user',
        adminDomains: [],
        createdAt: new Date().toISOString()
      });

      modified = true;
    }

    // 2. Seed Resources if empty
    if (this.data.resources.length === 0) {
      console.log('Seeding initial resources...');
      const sampleResources = [
        {
          id: 'res_1',
          domain: 'DSA',
          title: 'Asymptotic Analysis & Big O Notation',
          description: 'A comprehensive guide to understanding time and space complexity, recurrence relations, and master theorem.',
          link: 'https://www.geeksforgeeks.org/analysis-algorithms-big-o-analysis/',
          week: 'Week 1',
          createdAt: new Date().toISOString()
        },
        {
          id: 'res_2',
          domain: 'DSA',
          title: 'Mastering Linked Lists and Trees',
          description: 'Interactive visualization and practice problems for singly/doubly linked lists, binary trees, and BST operations.',
          link: 'https://visualgo.net/en/list',
          week: 'Week 2',
          createdAt: new Date().toISOString()
        },
        {
          id: 'res_3',
          domain: 'Machine Learning',
          title: 'Introduction to Linear Regression & Cost Functions',
          description: 'Mathematical derivation of simple linear regression, gradient descent, and evaluation metrics (MSE, R2).',
          link: 'https://towardsdatascience.com/linear-regression-detailed-view-ea73175d60e1',
          week: 'Week 1',
          createdAt: new Date().toISOString()
        },
        {
          id: 'res_4',
          domain: 'WebDev',
          title: 'HTML & CSS Deep Dive',
          description: 'Modern CSS layouts using Flexbox, CSS Grid, custom properties, and responsive design guidelines.',
          link: 'https://developer.mozilla.org/en-US/docs/Learn/CSS',
          week: 'Week 1',
          createdAt: new Date().toISOString()
        },
        {
          id: 'res_5',
          domain: 'Deep Learning',
          title: 'Neural Networks Basics & Backpropagation',
          description: 'Visual explanation of neural networks, weights, biases, activation functions, and backpropagation calculations.',
          link: 'https://www.youtube.com/watch?v=Ilg3gGewQ5U',
          week: 'Week 1',
          createdAt: new Date().toISOString()
        },
        {
          id: 'res_6',
          domain: 'DAV',
          title: 'Data Cleaning and Wrangling with Pandas',
          description: 'Handling missing values, duplicates, filtering data, grouping, and merging datasets using Pandas.',
          link: 'https://pandas.pydata.org/docs/user_guide/10min.html',
          week: 'Week 1',
          createdAt: new Date().toISOString()
        }
      ];
      this.data.resources = sampleResources;
      modified = true;
    }

    // 3. Seed Announcements if empty
    if (this.data.announcements.length === 0) {
      console.log('Seeding initial announcements...');
      const sampleAnnouncements = [
        {
          id: 'ann_1',
          domain: 'DSA',
          title: 'Week 1 Coding Challenge Live!',
          content: 'The first coding challenge on Arrays and String manipulation is now live. Complete the problems by Sunday 11:59 PM.',
          date: new Date().toISOString(),
          author: 'Rohan Sharma'
        },
        {
          id: 'ann_2',
          domain: 'Machine Learning',
          title: 'Kaggle Competition Rules',
          content: 'Welcome to the ML Domain! We have set up our first Kaggle competition. Please join using your university email.',
          date: new Date().toISOString(),
          author: 'TDA Super Admin'
        },
        {
          id: 'ann_3',
          domain: 'WebDev',
          title: 'Git & GitHub Hands-on Workshop',
          content: 'We will be hosting a hands-on session on Git branching models, pull requests, and hosting static sites on Friday at 6:00 PM.',
          date: new Date().toISOString(),
          author: 'TDA Super Admin'
        }
      ];
      this.data.announcements = sampleAnnouncements;
      modified = true;
    }

    // 4. Seed Leaderboard if empty
    if (this.data.leaderboard.length === 0) {
      console.log('Seeding initial leaderboard...');
      const sampleLeaderboard = [
        {
          id: 'lb_1',
          userId: 'user_1',
          userName: 'Aditya Sen',
          domain: 'DSA',
          scores: { 'Week 1 Task': 85, 'Week 2 Task': 90 },
          totalScore: 175,
          rank: 1
        },
        {
          id: 'lb_2',
          userId: 'user_1',
          userName: 'Aditya Sen',
          domain: 'WebDev',
          scores: { 'Project Proposal': 95 },
          totalScore: 95,
          rank: 2
        },
        {
          id: 'lb_3',
          userId: 'user_1',
          userName: 'Aditya Sen',
          domain: 'Machine Learning',
          scores: { 'Classification Task': 80 },
          totalScore: 80,
          rank: 2
        },
        {
          id: 'lb_4',
          userId: 'user_2',
          userName: 'Neha Gupta',
          domain: 'Machine Learning',
          scores: { 'Classification Task': 95 },
          totalScore: 95,
          rank: 1
        },
        {
          id: 'lb_5',
          userId: 'user_2',
          userName: 'Neha Gupta',
          domain: 'Deep Learning',
          scores: { 'CNN Implementation': 90 },
          totalScore: 90,
          rank: 1
        },
        {
          id: 'lb_6',
          userId: 'user_3',
          userName: 'Kabir Mehta',
          domain: 'WebDev',
          scores: { 'Project Proposal': 100 },
          totalScore: 100,
          rank: 1
        },
        {
          id: 'lb_7',
          userId: 'user_3',
          userName: 'Kabir Mehta',
          domain: 'DAV',
          scores: { 'Visualization Task': 88 },
          totalScore: 88,
          rank: 1
        }
      ];
      this.data.leaderboard = sampleLeaderboard;
      modified = true;
    }

    if (modified) {
      await this.save();
    }
  }

  // Helper CRUD methods
  async getUsers() {
    await this.init();
    return this.data.users;
  }

  async saveUsers(users) {
    await this.init();
    this.data.users = users;
    await this.save();
  }

  async getResources() {
    await this.init();
    return this.data.resources;
  }

  async saveResources(resources) {
    await this.init();
    this.data.resources = resources;
    await this.save();
  }

  async getAnnouncements() {
    await this.init();
    return this.data.announcements;
  }

  async saveAnnouncements(announcements) {
    await this.init();
    this.data.announcements = announcements;
    await this.save();
  }

  async getLeaderboard() {
    await this.init();
    return this.data.leaderboard;
  }

  async saveLeaderboard(leaderboard) {
    await this.init();
    this.data.leaderboard = leaderboard;
    await this.save();
  }
}

const db = new Database();
export default db;
