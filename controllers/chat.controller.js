const Joi = require("@hapi/joi");
const createHttpError = require("http-errors");
const httpStatus = require("../utils/http_status_codes");
const {
  ProfilesModel,
  ConversationsModel,
  MessagesModel,
} = require("../models");
const { isObjectIdValid, getValues } = require("../utils/common_utils");
const {
  conversationTypes,
  notificationTypes,
  collections,
} = require("../constants");
const NotificationsController = require("./notifications.controller");

module.exports = {
  getConversations: async (req, res, next) => {
    const errTitle = "Error when getting conversations.";

    try {
      const query = {
        profiles: req.params.id,
      };

      if (getValues(conversationTypes).includes(req.query.type)) {
        query.type = req.query.type;
      }

      const conversations = await ConversationsModel.find(query)
        .sort("-updatedAt")
        .populate({
          path: "profiles",
          select: "profile_picture name professions",
        })
        .populate("messages")
        .slice("messages", -1);

      return res.status(httpStatus.OK).send(conversations);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  getConversation: async (req, res, next) => {
    const errTitle = "Error when getting conversation.";

    ConversationsModel.findById(req.query.convoID)
      .select("type profiles messages")
      .populate({ path: "profiles", select: "name profile_picture" })
      .populate("messages")
      .then((convo) => {
        if (convo) {
          return res.status(httpStatus.OK).send(convo);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Conversation Not Found.",
            })
          );
        }
      })
      .catch((error) => {
        return next(
          createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
            title: errTitle,
            message: error,
          })
        );
      });
  },
  addConversation: async (req, res, next) => {
    const errTitle = "Error when adding conversations.";

    const reqSchema = Joi.object({
      connect_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error(
              "Connection Profile ID is not a valid Object ID."
            );
          }
          return value;
        })
        .required(),
      type: Joi.string()
        .valid(...getValues(conversationTypes))
        .required(),
    });
    const { error } = reqSchema.validate(req.body);
    if (error) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: error.details[0].message,
        })
      );
    }

    try {
      const profile = await ProfilesModel.findById(req.params.id);

      if (!profile.connections.includes(req.body.connect_id)) {
        return next(
          createHttpError(httpStatus.FORBIDDEN, {
            title: errTitle,
            message: "The other user is not a connection.",
          })
        );
      }

      const conversationExists = await ConversationsModel.findOne({
        profiles: [req.params.id, req.body.connect_id],
      });
      if (conversationExists) {
        return next(
          createHttpError(httpStatus.CONFLICT, {
            title: errTitle,
            message: "Conversation already exists.",
          })
        );
      }

      const conversation = await new ConversationsModel({
        type: req.body.type,
        profiles: [req.params.id, req.body.connect_id],
      }).save();

      await ProfilesModel.findByIdAndUpdate(
        req.params.id,
        {
          $addToSet: {
            conversations: conversation._id,
          },
        },
        { new: true }
      );
      await ProfilesModel.findByIdAndUpdate(
        req.body.connect_id,
        {
          $addToSet: {
            conversations: conversation._id,
          },
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send(conversation);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  updateConversation: async (req, res, next) => {
    const errTitle = "Error when updating conversations.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      convo_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Conversation ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
      type: Joi.string().valid(...getValues(conversationTypes)),
    });
    const { error } = reqSchema.validate(req.body);
    if (error) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: error.details[0].message,
        })
      );
    }

    try {
      const convo = await ConversationsModel.findOneAndUpdate(
        { _id: req.body.convo_id, profiles: req.body.profile_id },
        {
          type: req.body.type,
        },
        {
          new: true,
          fields: {
            messages: 0,
          },
        }
      );

      if (!convo) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Conversation Not Found.",
          })
        );
      }

      return res.status(httpStatus.OK).send(convo);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  getMessages: async (req, res, next) => {
    const errTitle = "Error when getting conversation messages.";

    if (!req.query.convoID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Conversation ID is required in params",
        })
      );
    } else if (!isObjectIdValid(req.query.convoID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Conversation ID is not a valid Object ID.",
        })
      );
    }

    if (!getValues(conversationTypes).includes(req.query.type)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Conversation type is required in query.",
        })
      );
    }

    ConversationsModel.findOne({
      _id: req.query.convoID,
      type: req.query.type,
      profiles: req.params.id,
    })
      .select("messages")
      .populate("messages")
      .then((convo) => {
        if (convo) {
          return res.status(httpStatus.OK).send(convo.messages);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Conversation Not Found.",
            })
          );
        }
      })
      .catch((error) => {
        return next(
          createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
            title: errTitle,
            message: error,
          })
        );
      });
  },
  addMessage: async (data, cb) => {
    const reqSchema = Joi.object({
      convo_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Conversation ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
      profile_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Profile ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
      message: Joi.string().allow("").disallow(null),
      link: Joi.object({
        type: Joi.string()
          .valid(...[collections.MEDIA, collections.PROJECT, collections.JOB])
          .required(),
        ref: Joi.string()
          .custom((value, helper) => {
            if (!isObjectIdValid(value)) {
              return helper.error("Ref ID is not a valid Object ID.");
            }
            return value;
          })
          .required(),
      }),
    });
    const { error } = reqSchema.validate(data);
    if (error) {
      return cb({
        message: error.details[0].message,
      });
    }

    try {
      const conversation = await ConversationsModel.findById(data.convo_id);
      if (!conversation) {
        return cb({
          message: "Conversation not found.",
        });
      }
      if (!conversation.profiles.includes(data.profile_id)) {
        return cb({
          message: "Profile not included in the conversation.",
        });
      }

      const profile = await ProfilesModel.findById(conversation.profiles[0]);
      const profile2 = await ProfilesModel.findById(conversation.profiles[1]);

      if (
        profile.blocked_profiles.includes(conversation.profiles[1]) ||
        profile2.blocked_profiles.includes(conversation.profiles[0])
      ) {
        return cb({
          message: "Profile blocked.",
        });
      }

      const message = await new MessagesModel({
        profile: data.profile_id,
        conversation: data.convo_id,
        message: data.message ? data.message : "shared",
        link: data.link,
        date: new Date(),
      }).save();

      const convo = await ConversationsModel.findByIdAndUpdate(
        data.convo_id,
        {
          $push: {
            messages: message._id,
          },
        },
        { new: true }
      );

      // Send Notification to receiver
      const notif_profiles = convo.profiles.filter(
        (prof) => prof.toString() !== data.profile_id
      );
      const profile_from = data.profile_id;
      const convo_id = convo._id;
      const notification = {
        profiles: notif_profiles.map((id) => id.toString()),
        type: notificationTypes.NEW_CHAT_MESSAGE,
        message: `@{profile:${profile_from}} has sent you a message`,
        action: `/chat/${convo.type.toLowerCase()}/${convo_id}`,
        mentioned_profiles: [profile_from].map((id) => id.toString()),
        mentioned_conversations: [convo_id].map((id) => id.toString()),
      };

      await NotificationsController.pushNotification(notification);

      cb(null, {
        profiles: convo.profiles,
        message,
      });
    } catch (e) {
      cb({
        message: e,
      });
    }
  },
  removeMessage: async (data, cb) => {
    const reqSchema = Joi.object({
      message_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Message ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
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
      return cb({
        message: error.details[0].message,
      });
    }

    try {
      const message = await MessagesModel.findOneAndDelete({
        _id: data.message_id,
        profile: data.profile_id,
      });

      if (!message) {
        return cb({
          message: "Message not found.",
        });
      }

      const convo = await ConversationsModel.findByIdAndUpdate(
        message.conversation,
        {
          $pull: {
            messages: message._id,
          },
        },
        { new: true }
      );

      cb(null, {
        profiles: convo.profiles,
        message,
      });
    } catch (e) {
      cb({
        message: e,
      });
    }
  },
};
