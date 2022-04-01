const mongoose = require("mongoose");
const { collections } = require("../constants");

const commentSchema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.PROFILE,
      required: true,
    },
    media: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.MEDIA,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    stars: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.PROFILE,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Comment = new mongoose.model(collections.COMMENT, commentSchema);

module.exports = Comment;
