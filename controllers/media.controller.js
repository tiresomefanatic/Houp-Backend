const fs = require("fs");
const path = require("path");
const Joi = require("@hapi/joi");
const createHttpError = require("http-errors");
const httpStatus = require("../utils/http_status_codes");
const {
  MediaModel,
  CommentsModel,
  ProfilesModel,
  ProjectsModel,
} = require("../models");
const { contentTypes, notificationTypes } = require("../constants");
const { isObjectIdValid, getValues } = require("../utils/common_utils");
const { AuthGuard } = require("../middlewares");
const NotificationsController = require("./notifications.controller");

module.exports = {
  getAllMedia: async (req, res, next) => {
    const errTitle = "Error when getting all media.";

    MediaModel.find()
      .exec()
      .then((docs) => {
        if (docs) {
          return res.status(httpStatus.OK).send(docs);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Media Not Found.",
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
  getProfileMedia: async (req, res, next) => {
    const errTitle = "Error when getting profile media.";

    if (!req.params.id) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Profile ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.params.id)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Profile ID is not a valid Object ID.",
        })
      );
    }

    try {
      const profile = await ProfilesModel.findById(req.params.id).select(
        "profile_picture name"
      );

      if (!profile) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Profile Not Found.",
          })
        );
      }

      const media = await MediaModel.find({ profile: req.params.id })
        .populate({
          path: "profile",
          select: "profile_picture name",
        })
        .populate({
          path: "comments",
          options: {
            limit: 1,
            sort: { createdAt: -1 },
          },
          populate: {
            path: "profile",
            select: "profile_picture name",
          },
        });

      if (!media) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Media Not Found.",
          })
        );
      }

      return res.status(httpStatus.OK).send({ profile, media });
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  getProjectMedia: async (req, res, next) => {
    const errTitle = "Error when getting project media.";

    if (!req.params.project_id) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Project ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.params.project_id)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Project ID is not a valid Object ID.",
        })
      );
    }

    try {
      const project = await ProjectsModel.findById(
        req.params.project_id
      ).select("project_cover_picture project_title");

      if (!project) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Project Not Found.",
          })
        );
      }

      const media = await MediaModel.find({
        project: req.params.project_id,
      })
        .populate({
          path: "project",
          select: "project_cover_picture project_title",
        })
        .populate({
          path: "comments",
          options: {
            limit: 1,
            sort: { createdAt: -1 },
          },
          populate: {
            path: "profile",
            select: "profile_picture name",
          },
        });

      if (!media) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Media Not Found.",
          })
        );
      }

      return res.status(httpStatus.OK).send({ project, media });
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  getMedia: async (req, res, next) => {
    const errTitle = "Error when getting media.";

    if (!req.params.media_id) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Media ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.params.media_id)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Media ID is not a valid Object ID.",
        })
      );
    }

    AuthGuard(req, res, () => {
      if (req.profile && req.profile.profile_id) {
        MediaModel.findByIdAndUpdate(
          req.params.media_id,
          { $addToSet: { views: req.profile.profile_id } },
          { new: true }
        )
          .populate({
            path: "profile",
            select: "profile_picture name",
          })
          .populate({
            path: "project",
            select: "project_cover_picture project_title",
          })
          .populate({
            path: "comments",
            options: {
              sort: { createdAt: -1 },
            },
            populate: {
              path: "profile",
              select: "profile_picture name",
            },
          })
          .exec()
          .then((doc) => {
            if (doc) {
              return res.status(httpStatus.OK).send(doc);
            } else {
              return next(
                createHttpError(httpStatus.NOT_FOUND, {
                  title: errTitle,
                  message: "Media Not Found.",
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
      } else {
        MediaModel.findById(req.params.media_id)
          .populate({
            path: "profile",
            select: "profile_picture name",
          })
          .populate({
            path: "project",
            select: "project_cover_picture project_title",
          })
          .populate({
            path: "comments",
            options: {
              sort: { createdAt: -1 },
            },
            populate: {
              path: "profile",
              select: "profile_picture name",
            },
          })
          .exec()
          .then((doc) => {
            if (doc) {
              return res.status(httpStatus.OK).send(doc);
            } else {
              return next(
                createHttpError(httpStatus.NOT_FOUND, {
                  title: errTitle,
                  message: "Media Not Found.",
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
      }
    });
  },
  addMedia: async (req, res, next) => {
    const errTitle = "Error when adding media.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      project_id: Joi.string().custom((value, helper) => {
        if (!isObjectIdValid(value)) {
          return helper.error("Project ID is not a valid Object ID.");
        }
        return value;
      }),
      caption: Joi.string().allow(""),
      content_types: Joi.array()
        .items(Joi.string().valid(...getValues(contentTypes)))
        .min(1),
      tags: Joi.array().items(Joi.string()),
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

    if (!req.files) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Please add a media to be published.",
        })
      );
    }

    try {
      const newMedia = { ...req.body };
      newMedia.profile = req.body.profile_id;
      delete newMedia.profile_id;
      newMedia.project = req.body.project_id;
      delete newMedia.project_id;
      newMedia.date = new Date();
      newMedia.cover_picture = req.files.cover_picture;
      newMedia.media = req.files.media;

      const media = await new MediaModel(newMedia).save();

      if (req.body.project_id) {
        await ProjectsModel.findByIdAndUpdate(
          req.body.project_id,
          {
            $push: {
              project_media: media._id,
            },
          },
          { new: true }
        );
      } else {
        await ProfilesModel.findByIdAndUpdate(
          req.body.profile_id,
          {
            $push: {
              media: media._id,
            },
          },
          { new: true }
        );
      }

      return res.status(httpStatus.OK).send(media);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  updateMedia: async (req, res, next) => {
    const errTitle = "Error when updating media.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      media_id: Joi.string().required(),
      caption: Joi.string().allow(""),
      content_types: Joi.array()
        .items(Joi.string().valid(...getValues(contentTypes)))
        .min(1),
      tags: Joi.array().items(Joi.string()),
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

    if (!req.files) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Please add a media to be published.",
        })
      );
    }

    try {
      const newMedia = { ...req.body };
      delete newMedia.media_id;
      delete newMedia.profile_id;
      newMedia.cover_picture = req.files.cover_picture;
      newMedia.media = req.files.media;

      const media = await MediaModel.findOneAndUpdate(
        { _id: req.body.media_id, profile: req.body.profile_id },
        newMedia,
        { new: true }
      );

      if (!media) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Media Not Found.",
          })
        );
      }

      return res.status(httpStatus.OK).send(media);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  uploadMediaMedia: async (req, res, next) => {
    const errTitle = "Error when updating media media.";

    if (!req.files) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Please add a media to be published.",
        })
      );
    }

    try {
      const media = await MediaModel.findByIdAndUpdate(
        req.query.mediaID,
        {
          cover_picture: req.files.cover_picture,
          media: req.files.media,
        },
        {
          new: true,
        }
      );

      return res.status(httpStatus.OK).send(media);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  removeMedia: async (req, res, next) => {
    const errTitle = "Error when removing media.";

    try {
      const media = await MediaModel.findByIdAndDelete(req.query.mediaID);

      if (media.project) {
        await ProjectsModel.findByIdAndUpdate(
          media.project,
          {
            $pull: {
              project_media: req.query.mediaID,
            },
          },
          { new: true }
        );
      } else {
        await ProfilesModel.findByIdAndUpdate(
          req.params.id,
          {
            $pull: {
              media: req.query.mediaID,
            },
          },
          { new: true }
        );
      }

      return res.status(httpStatus.OK).send(media);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  starMedia: async (req, res, next) => {
    const errTitle = "Error when starring media.";

    if (!req.query.mediaID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Media ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.mediaID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Media ID is not a valid Object ID.",
        })
      );
    }

    try {
      const media = await MediaModel.findByIdAndUpdate(
        req.query.mediaID,
        {
          $addToSet: {
            stars: req.params.id,
          },
        },
        { new: true }
      );

      if (!media) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Media Not Found.",
          })
        );
      }

      // Send Notification to media owner
      const notif_profiles = [media.profile];
      const profile_from = req.params.id;
      const media_id = media._id.toString();
      const notification = {
        profiles: notif_profiles.map((id) => id.toString()),
        type: notificationTypes.NEW_MEDIA_STAR,
        message: `@{profile:${profile_from}} has starred your media @{media:${media_id}}`,
        action: `/media/${media_id}`,
        mentioned_profiles: [profile_from].map((id) => id.toString()),
        mentioned_media: [media_id].map((id) => id.toString()),
      };

      await NotificationsController.pushNotification(notification);

      return res.status(httpStatus.OK).send(media);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  unStarMedia: async (req, res, next) => {
    const errTitle = "Error when un-starring media.";

    if (!req.query.mediaID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Media ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.mediaID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Media ID is not a valid Object ID.",
        })
      );
    }

    try {
      const media = await MediaModel.findByIdAndUpdate(
        req.query.mediaID,
        {
          $pull: {
            stars: req.params.id,
          },
        },
        { new: true }
      );

      if (!media) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Media Not Found.",
          })
        );
      }

      return res.status(httpStatus.OK).send(media);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  getSavedMedia: async (req, res, next) => {
    const errTitle = "Error when getting saved profile media.";

    try {
      const profile = await ProfilesModel.findById(req.params.id).populate({
        path: "saved_media",
        populate: [
          {
            path: "project",
            select: "project_cover_picture project_title",
          },
          {
            path: "comments",
            options: {
              limit: 1,
              sort: { createdAt: -1 },
            },
            populate: {
              path: "profile",
              select: "profile_picture name",
            },
          },
        ],
      });

      return res.status(httpStatus.OK).send(profile.saved_media);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  saveMedia: async (req, res, next) => {
    const errTitle = "Error when saving media.";

    if (!req.query.mediaID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Media ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.mediaID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Media ID is not a valid Object ID.",
        })
      );
    }

    try {
      const media = await MediaModel.findById(req.query.mediaID);

      if (!media) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Media Not Found.",
          })
        );
      }

      const profile = await ProfilesModel.findByIdAndUpdate(
        req.params.id,
        {
          $addToSet: {
            saved_media: media._id,
          },
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send(profile.saved_media);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  unSaveMedia: async (req, res, next) => {
    const errTitle = "Error when un-saving media.";

    if (!req.query.mediaID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Media ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.mediaID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Media ID is not a valid Object ID.",
        })
      );
    }

    try {
      const profile = await ProfilesModel.findByIdAndUpdate(
        req.params.id,
        {
          $pull: {
            saved_media: req.query.mediaID,
          },
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send(profile.saved_media);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  addComment: async (req, res, next) => {
    const errTitle = "Error when adding comment to media.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      media_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Media ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
      comment: Joi.string().required(),
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
      const comment = await new CommentsModel({
        profile: req.body.profile_id,
        media: req.body.media_id,
        body: req.body.comment,
        date: new Date(),
      }).save();

      const media = await MediaModel.findByIdAndUpdate(
        req.body.media_id,
        { $push: { comments: comment._id } },
        { new: true }
      );

      if (!media) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Media Not Found.",
          })
        );
      }

      // Send Notification to media owner
      const notif_profiles = [media.profile];
      const profile_from = req.body.profile_id;
      const media_id = media._id.toString();
      const notification = {
        profiles: notif_profiles.map((id) => id.toString()),
        type: notificationTypes.NEW_MEDIA_COMMENT,
        message: `@{profile:${profile_from}} has commented on your media @{media:${media_id}}`,
        action: `/media/${media_id}`,
        mentioned_profiles: [profile_from].map((id) => id.toString()),
        mentioned_media: [media_id].map((id) => id.toString()),
      };

      await NotificationsController.pushNotification(notification);

      return res.status(httpStatus.OK).send(comment);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  removeComment: async (req, res, next) => {
    const errTitle = "Error when removing comment from media.";

    if (!req.query.commentID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Comment ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.commentID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Comment ID is not a valid Object ID.",
        })
      );
    }

    try {
      const comment = await CommentsModel.findOneAndDelete({
        _id: req.query.commentID,
        profile: req.params.id,
      });

      if (!comment) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Comment Not Found.",
          })
        );
      }

      const media = await MediaModel.findByIdAndUpdate(
        comment.media,
        {
          $pull: {
            comments: comment._id,
          },
        },
        { new: true }
      );

      if (!media) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Media Not Found.",
          })
        );
      }

      return res.status(httpStatus.OK).send(comment);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  starComment: async (req, res, next) => {
    const errTitle = "Error when starring comment.";

    if (!req.query.commentID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Comment ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.commentID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Comment ID is not a valid Object ID.",
        })
      );
    }

    try {
      const comment = await CommentsModel.findByIdAndUpdate(
        req.query.commentID,
        {
          $addToSet: {
            stars: req.params.id,
          },
        },
        { new: true }
      );

      if (!comment) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Comment Not Found.",
          })
        );
      }

      // Send Notification to comment author
      const notif_profiles = [comment.profile];
      const profile_from = req.params.id;
      const media_id = comment.media.toString();
      const notification = {
        profiles: notif_profiles.map((id) => id.toString()),
        type: notificationTypes.NEW_MEDIA_COMMENT_STAR,
        message: `@{profile:${profile_from}} has starred your comment on media @{media:${media_id}}`,
        action: `/media/${media_id}`,
        mentioned_profiles: [profile_from].map((id) => id.toString()),
        mentioned_media: [media_id].map((id) => id.toString()),
      };

      await NotificationsController.pushNotification(notification);

      return res.status(httpStatus.OK).send(comment);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  unStarComment: async (req, res, next) => {
    const errTitle = "Error when un-starring comment.";

    if (!req.query.commentID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Comment ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.commentID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Comment ID is not a valid Object ID.",
        })
      );
    }

    try {
      const comment = await CommentsModel.findByIdAndUpdate(
        req.query.commentID,
        {
          $pull: {
            stars: req.params.id,
          },
        },
        { new: true }
      );

      if (!comment) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Comment Not Found.",
          })
        );
      }

      return res.status(httpStatus.OK).send(comment);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
};
