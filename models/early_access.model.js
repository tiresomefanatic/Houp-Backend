const mongoose = require("mongoose");
const { collections } = require("../constants");

const earlyAccessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const EarlyAccess = new mongoose.model(
  collections.EARLY_ACCESS,
  earlyAccessSchema
);

module.exports = EarlyAccess;
