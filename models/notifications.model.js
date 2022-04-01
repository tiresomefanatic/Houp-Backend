const mongoose = require("mongoose");
const { collections, notificationTypes } = require("../constants");
const { getValues } = require("../utils/common_utils");

const notificationSchema = new mongoose.Schema({
  profiles: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.PROFILE,
      },
    ],
    required: true,
  },
  type: {
    type: String,
    enum: getValues(notificationTypes),
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  action: {
    type: String,
  },
  mentioned_profiles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.PROFILE,
    },
  ],
  mentioned_projects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.PROJECT,
    },
  ],
  mentioned_media: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.MEDIA,
    },
  ],
  mentioned_jobs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.JOB,
    },
  ],
  mentioned_conversations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.CONVERSATION,
    },
  ],
  read_by: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.PROFILE,
    },
  ],
  date: {
    type: Date,
    required: true,
  },
});

const Notification = new mongoose.model(
  collections.NOTIFICATION,
  notificationSchema
);

module.exports = Notification;
