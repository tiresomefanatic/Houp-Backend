const Joi = require("@hapi/joi");
const createHttpError = require("http-errors");
const webPush = require("web-push");
const httpStatus = require("../utils/http_status_codes");
const {
  ProfilesModel,
  NotificationsModel,
  NotificationSubscriptionsModel,
} = require("../models");
const {
  isObjectIdValid,
  getValues,
  getNotifMessage,
} = require("../utils/common_utils");
const { notificationTypes } = require("../constants");
const { AuthGuard } = require("../middlewares");

module.exports = {
  getNotifications: async (req, res, next) => {
    const errTitle = "Error when getting notifications.";

    try {
      const popObj = {
        path: "notifications",
        match: {
          type: {
            $nin: [
              notificationTypes.NEW_CHAT_MESSAGE,
              notificationTypes.CONNECTION_REQUEST,
              notificationTypes.PROJECT_INVITE,
            ],
          },
        },
        options: {
          sort: { date: -1 },
        },
        populate: [
          {
            path: "mentioned_profiles",
            select: "profile_picture name",
          },
          {
            path: "mentioned_projects",
            select: "project_cover_picture project_title",
          },
          {
            path: "mentioned_media",
            select: "cover_picture caption",
          },
          {
            path: "mentioned_jobs",
            select: "project_cover_picture project_title",
          },
          {
            path: "mentioned_conversations",
            select: "profiles",
            populate: {
              path: "profiles",
              select: "profile_picture name",
            },
          },
        ],
      };

      const profile = await ProfilesModel.findById(req.params.id).populate(
        popObj
      );

      let notifications = profile.notifications;

      const { read, type } = req.query;
      if (read) {
        if (read !== "false") {
          notifications = notifications.filter((notif) =>
            notif.read_by.includes(req.params.id)
          );
        } else {
          notifications = notifications.filter(
            (notif) => !notif.read_by.includes(req.params.id)
          );
        }
      }
      if (getValues(notificationTypes).includes(type)) {
        notifications = notifications.filter((notif) => notif.type === type);
      }

      // const naNotifTypes = [
      //   notificationTypes.CONNECTION_REQUEST,
      //   notificationTypes.PROJECT_INVITE,
      // ];
      // notifications = notifications.filter(
      //   (notif) => !naNotifTypes.includes(notif.type)
      // );

      // const nonChatNotifs = notifications.filter(
      //   (notif) => notif.type !== notificationTypes.NEW_CHAT_MESSAGE
      // );
      // const chatNotifs = notifications.filter(
      //   (notif) => notif.type === notificationTypes.NEW_CHAT_MESSAGE
      // );

      // const minChatNotifs = [];
      // chatNotifs.forEach((notif) => {
      //   const existNotifIndx = minChatNotifs.findIndex((notf) => {
      //     const sameConvo =
      //       notif.mentioned_conversations[0] ===
      //       notf.mentioned_conversations[0];
      //     const sameProfile =
      //       notif.mentioned_profiles[0] === notf.mentioned_profiles[0];
      //     return sameConvo && sameProfile;
      //   });

      //   if (existNotifIndx >= 0) {
      //     const existNotif = minChatNotifs[existNotifIndx];
      //     existNotif.count = existNotif.count ? existNotif.count + 1 : 1;
      //     minChatNotifs[existNotifIndx] = existNotif;
      //   } else {
      //     notif.count = 1;
      //     minChatNotifs.push(notif);
      //   }
      // });

      // minChatNotifs = minChatNotifs.map((notf) => {
      //   const notif = { ...notf };
      //   notif.message += notif.count > 1 ? ` (${notif.count})` : "";
      //   delete notif.count;
      //   return notif;
      // });

      // notifications = [...nonChatNotifs, ...minChatNotifs];

      return res.status(httpStatus.OK).send(notifications);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  subscribeNotifications: async (req, res, next) => {
    const errTitle = "Error when subscribing to notifications.";

    try {
      AuthGuard(req, res, async (error) => {
        let subscription;

        if (req.profile && !error) {
          const subscribed = await NotificationSubscriptionsModel.findOne({
            profile: req.profile.profile_id,
          });

          if (subscribed) {
            subscription = await NotificationSubscriptionsModel.findByIdAndUpdate(
              subscribed._id,
              { subscription: req.body },
              { new: true }
            );
          } else {
            subscription = await new NotificationSubscriptionsModel({
              profile: req.profile.profile_id,
              subscription: req.body,
            }).save();
          }
        } else {
          const subscribed = await NotificationSubscriptionsModel.findOne({
            "subscription.endpoint": req.body.endpoint,
            "subscription.expirationTime": req.body.expirationTime,
            "subscription.keys.p256dh": req.body.keys.p256dh,
            "subscription.keys.auth": req.body.keys.auth,
          });

          if (!subscribed) {
            subscription = await new NotificationSubscriptionsModel({
              subscription: req.body,
            }).save();
          }
        }

        return res.status(httpStatus.OK).send(subscription);
      });
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  pushNotification: async (notification) => {
    const errTitle = "Error when pushing notification.";

    const reqSchema = Joi.object({
      profiles: Joi.array()
        .items(
          Joi.string().custom((value, helper) => {
            if (!isObjectIdValid(value)) {
              return helper.error("Profile ID is not a valid Object ID.");
            }
            return value;
          })
        )
        .min(1)
        .required(),
      type: Joi.string()
        .valid(...getValues(notificationTypes))
        .required(),
      message: Joi.string().required(),
      action: Joi.string(),
      mentioned_profiles: Joi.array().items(
        Joi.string().custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Profile ID is not a valid Object ID.");
          }
          return value;
        })
      ),
      mentioned_projects: Joi.array().items(
        Joi.string().custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Project ID is not a valid Object ID.");
          }
          return value;
        })
      ),
      mentioned_media: Joi.array().items(
        Joi.string().custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Media ID is not a valid Object ID.");
          }
          return value;
        })
      ),
      mentioned_jobs: Joi.array().items(
        Joi.string().custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Job ID is not a valid Object ID.");
          }
          return value;
        })
      ),
      mentioned_conversations: Joi.array().items(
        Joi.string().custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Conversation ID is not a valid Object ID.");
          }
          return value;
        })
      ),
    });
    const { error } = reqSchema.validate(notification);
    if (error) {
      return {
        error: {
          title: errTitle,
          message: error.details[0].message,
        },
      };
    }

    try {
      notification.date = new Date();
      const newNotification = await new NotificationsModel(notification).save();

      await newNotification.profiles.forEach(async (profile_id) => {
        await ProfilesModel.findByIdAndUpdate(
          profile_id,
          {
            $push: {
              notifications: newNotification._id,
            },
          },
          { new: true }
        );

        // Push notification to profile via socket
        if (global.profilesOnline && global.profilesOnline[profile_id]) {
          global.profilesOnline[profile_id].notifications.push(newNotification);

          global.profilesOnline[profile_id].notifSessions.forEach(
            (sessionId) => {
              if (global.notifSocket) {
                global.notifSocket
                  .to(sessionId)
                  .emit("new-notification", newNotification);
              }
            }
          );
        } else {
          const sub = await NotificationSubscriptionsModel.findOne({
            profile: profile_id,
          });
          if (sub) {
            const notif = await NotificationsModel.findById(newNotification._id)
              .populate({
                path: "mentioned_profiles",
                select: "profile_picture name",
              })
              .populate({
                path: "mentioned_projects",
                select: "project_cover_picture project_title",
              })
              .populate({
                path: "mentioned_media",
                select: "cover_picture caption",
              })
              .populate({
                path: "mentioned_jobs",
                select: "project_cover_picture project_title",
              })
              .populate({
                path: "mentioned_conversations",
                select: "profiles",
                populate: {
                  path: "profiles",
                  select: "profile_picture name",
                },
              });
            const message = getNotifMessage(notif);
            if (message) {
              webPush
                .sendNotification(
                  sub.subscription,
                  JSON.stringify({ title: message })
                )
                .catch((err) => console.error(err));
            }
          }
        }
      });

      return {
        data: notification,
      };
    } catch (e) {
      return {
        error: {
          title: errTitle,
          message: e,
        },
      };
    }
  },
  readNotification: async (data) => {
    const errTitle = "Error when reading notification.";

    const reqSchema = Joi.object({
      profile_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Profile ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
      notification_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Notification ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
    });
    const { error } = reqSchema.validate(data);
    if (error) {
      return {
        error: {
          title: errTitle,
          message: error.details[0].message,
        },
      };
    }

    try {
      const notification = await NotificationsModel.findOneAndUpdate(
        { _id: data.notification_id, profiles: data.profile_id },
        {
          $addToSet: {
            read_by: data.profile_id,
          },
        },
        { new: true }
      );

      // Update notifications of profile via socket
      if (global.profilesOnline && global.profilesOnline[data.profile_id]) {
        const index = global.profilesOnline[
          data.profile_id
        ].notifications.findIndex((notif) => notif._id === notification._id);
        global.profilesOnline[data.profile_id].notifications.splice(index, 1);

        global.profilesOnline[data.profile_id].notifSessions.forEach(
          (sessionId) => {
            if (global.notifSocket) {
              global.notifSocket
                .to(sessionId)
                .emit("read-notification", notification);
            }
          }
        );
      }

      return {
        data: notification,
      };
    } catch (e) {
      return {
        error: {
          title: errTitle,
          message: e,
        },
      };
    }
  },
  readAllNotifications: async (data) => {
    const errTitle = "Error when reading all notification.";

    const reqSchema = Joi.object({
      profile_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Profile ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
    });
    const { error } = reqSchema.validate(data);
    if (error) {
      return {
        error: {
          title: errTitle,
          message: error.details[0].message,
        },
      };
    }

    try {
      await NotificationsModel.updateMany(
        { profiles: data.profile_id },
        {
          $addToSet: {
            read_by: data.profile_id,
          },
        },
        { new: true }
      );

      // Update notifications of profile via socket
      if (global.profilesOnline && global.profilesOnline[data.profile_id]) {
        global.profilesOnline[data.profile_id].notifications = [];

        global.profilesOnline[data.profile_id].notifSessions.forEach(
          (sessionId) => {
            if (global.notifSocket) {
              global.notifSocket.to(sessionId).emit("notifications", []);
            }
          }
        );
      }
    } catch (e) {
      return {
        error: {
          title: errTitle,
          message: e,
        },
      };
    }
  },
};
