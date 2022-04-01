const mongoose = require("mongoose");
const { professions, collections } = require("../constants");
const { getValues } = require("../utils/common_utils");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.JOB,
      required: true,
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.PROFILE,
      required: true,
    },
    applying_for: {
      type: String,
      enum: getValues(professions, "role"),
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Application = new mongoose.model(
  collections.APPLICATION,
  applicationSchema
);

module.exports = Application;
