const mongoose = require("mongoose");
const { collections } = require("../constants");

const notificationSubscriptionSchema = mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.PROFILE,
    },
    subscription: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const NotificationSubscription = new mongoose.model(
  collections.NOTIFICATION_SUBSCRIPTION,
  notificationSubscriptionSchema
);

module.exports = NotificationSubscription;
