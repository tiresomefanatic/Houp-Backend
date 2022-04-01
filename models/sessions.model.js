const mongoose = require("mongoose");
const { collections } = require("../constants");

const sessionsSchema = mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.PROFILE,
      required: true,
    },
    loggedInAt: {
      type: Date,
      required: true,
    },
    loggedOutAt: {
      type: Date,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    lastActiveOn: {
      type: Date,
      default: new Date(),
    },
    jti: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Session = new mongoose.model(collections.SESSION, sessionsSchema);

module.exports = Session;
