const mongoose = require("mongoose");
const { collections, connectionStatuses } = require("../constants");
const { getValues } = require("../utils/common_utils");

const connectionPendingSchema = mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.PROFILE,
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.PROFILE,
      required: true,
    },
    initiatedAt: {
      type: Date,
      default: new Date(),
    },
    status: {
      type: String,
      enum: getValues(connectionStatuses),
      default: connectionStatuses.PENDING,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ConnectionPending = new mongoose.model(
  collections.CONNECTION_PENDING,
  connectionPendingSchema
);

module.exports = ConnectionPending;
