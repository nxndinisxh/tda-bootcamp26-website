import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },

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

  scores: {
    type: Object,
    default: {}
  },

  totalScore: {
    type: Number,
    default: 0
  },

  rank: {
    type: Number,
    default: 999
  }
});

export default mongoose.model("Leaderboard", leaderboardSchema);