const mongoose = require("mongoose");
const { collections } = require("../constants");

const reportSchema = new mongoose.Schema({
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: collections.PROFILE,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: collections.PROJECT,
  },
  media: {
    type: mongoose.Schema.Types.ObjectId,
    ref: collections.MEDIA,
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: collections.COMMENT,
  },
  by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: collections.PROFILE,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  resolved: {
    type: {
      resolved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.PROFILE,
        required: true,
      },
      resolved_at: {
        type: Date,
        required: true,
      },
    },
    default: false,
  },
});

const Report = new mongoose.model(collections.REPORT, reportSchema);

module.exports = Report;
