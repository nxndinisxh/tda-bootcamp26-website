import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  userName: {
    type: String,
    required: true
  },

  domain: {
    type: String,
    required: true
  },

  leaderboardType: {
    type: String,
    enum: ["weekly", "overall"],
    required: true
  },

  weekNumber: {
    type: Number,
    required: false
  },

  score: {
    type: Number,
    required: true
  },

  weeklyBreakdown: {
    type: Object,
    default: {}
  },

  rank: {
    type: Number,
    required: true
  },

  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Leaderboard", leaderboardSchema);