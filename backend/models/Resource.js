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
    default: ''
  },

  links: [{
    label: { type: String, default: '' },
    url: { type: String, required: true }
  }],

  week: {
    type: String,
    required: true
  },

  order: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Resource", resourceSchema);