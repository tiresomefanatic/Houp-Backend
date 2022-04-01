const mongoose = require("mongoose");
const { collections } = require("../constants");

const emailTokensSchema = mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.PROFILE,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const EmailToken = new mongoose.model(collections.EMAIL_TOKEN, emailTokensSchema);

module.exports = EmailToken;
