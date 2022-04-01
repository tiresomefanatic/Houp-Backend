const mongoose = require("mongoose");
const { collections } = require("../constants");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.CONVERSATION,
      required: true,
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.PROFILE,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: {
        type: String,
        enum: [collections.MEDIA, collections.PROJECT, collections.JOB],
      },
      ref: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Message = new mongoose.model(collections.MESSAGE, messageSchema);

module.exports = Message;
