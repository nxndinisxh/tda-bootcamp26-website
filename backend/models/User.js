import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  passwordHash: {
    type: String,
    required: false
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  verificationOtp: {
    type: String,
    required: false
  },

  verificationOtpExpires: {
    type: Date,
    required: false
  },

  verificationToken: {
    type: String,
    required: false
  },

  verificationTokenExpires: {
    type: Date,
    required: false
  },

  tempPassword: {
    type: String,
    required: false
  },

  domains: {
    type: [String],
    default: []
  },

  role: {
    type: String,
    enum: ["user", "admin", "super_admin"],
    default: "user"
  },

  adminDomains: {
    type: [String],
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("User", userSchema);