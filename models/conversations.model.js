const mongoose = require("mongoose");
const { collections, conversationTypes } = require("../constants");
const { getValues } = require("../utils/common_utils");

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: getValues(conversationTypes),
      required: true,
    },
    profiles: [
      { type: mongoose.Schema.Types.ObjectId, ref: collections.PROFILE },
    ],
    messages: [
      { type: mongoose.Schema.Types.ObjectId, ref: collections.MESSAGE },
    ],
  },
  {
    timestamps: true,
  }
);

const Conversation = new mongoose.model(
  collections.CONVERSATION,
  conversationSchema
);

module.exports = Conversation;
