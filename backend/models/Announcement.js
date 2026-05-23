import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },

  domain: {
    type: String,
    required: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  content: {
    type: String,
    required: true
  },

  date: {
    type: Date,
    default: Date.now
  },

  author: {
    type: String,
    required: true
  }
});

export default mongoose.model("Announcement", announcementSchema);