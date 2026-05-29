import mongoose from "mongoose";

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  resourceId: {
    type: String,
    required: true
  },

  completed: {
    type: Boolean,
    default: false
  },

  completedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index for userId and resourceId
userProgressSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

export default mongoose.model("UserProgress", userProgressSchema);
