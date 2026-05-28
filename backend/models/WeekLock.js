import mongoose from "mongoose";

const weekLockSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true
  },

  week: {
    type: String,
    required: true
  },

  isLocked: {
    type: Boolean,
    default: true
  }
});

// Compound unique index so there is only one entry per domain and week
weekLockSchema.index({ domain: 1, week: 1 }, { unique: true });

export default mongoose.model("WeekLock", weekLockSchema);
