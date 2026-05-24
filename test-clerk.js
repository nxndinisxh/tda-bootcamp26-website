import dotenv from 'dotenv';
dotenv.config();

import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
});

const token = "eyJhbGciOiJSUzI1NiIsImtpZCI6Imluc18yZWx6d3EwM3U4TVBEeWpsRG82N0RSbnpmQUQifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjUxNzMiLCJleHAiOjE3Nzk2MDA4NDgsImZ2YSI6WzgsLTFdLCJpYXQiOjE3Nzk2MDA3ODgsImlzcyI6Imh0dHBzOi8vbW92ZWQtc2Vhc25haWwtODYuY2xlcmsuYWNjb3VudHMuZGV2IiwibmJmIjoxNzc5NjAwNzc4LCJzaWQiOiJzZXNzXzNFOW9nVlRLaHRtdGh1NjZmekJhaUdhQ01kSCIsInN0cyI6ImFjdGl2ZSIsInN1YiI6InVzZXJfM0U5Z2Nna3J5S1ljVFh2R1R2RUpqVXdLekxoIiwidiI6Mn0.iK..."; // Wait, I don't have the full token! I only have the payload.

console.log('Need full token to verify');
