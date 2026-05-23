import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
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

  description: {
    type: String,
    default: ""
  },

  link: {
    type: String,
    required: true
  },

  week: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Resource", resourceSchema);