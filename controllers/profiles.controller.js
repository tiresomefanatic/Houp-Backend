const Joi = require("@hapi/joi");
const fs = require("fs");
const path = require("path");
const createHttpError = require("http-errors");
const httpStatus = require("../utils/http_status_codes");
const { ProfilesModel, ConnectionsPendingModel } = require("../models");
const {
  professions,
  genders,
  units,
  languages,
  grades,
  connectionStatuses,
  notificationTypes,
  roles,
} = require("../constants");
const { isObjectIdValid, getValues } = require("../utils/common_utils");
const NotificationsController = require("./notifications.controller");

const publicRestrictedFields = {
  roles: 0,
  conversations: 0,
  blocked_profiles: 0,
  jobs_applied: 0,
  password: 0,
};
const profileRestrictedFields = {
  roles: 0,
  password: 0,
};
const adminRestrictedFields = {
  password: 0,
};

module.exports = {
  getAllProfilesAdmin: (req, res, next) => {
    const errTitle = "Error when getting all profiles by admin.";

    ProfilesModel.find()
      .select(adminRestrictedFields)
      .exec()
      .then((docs) => {
        if (docs) {
          return res.status(httpStatus.OK).send(docs);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Profiles Not Found.",
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
  getAllProfiles: (req, res, next) => {
    const errTitle = "Error when getting all profiles.";

    ProfilesModel.find({
      roles: roles.USER,
    })
      .select(publicRestrictedFields)
      .exec()
      .then((docs) => {
        if (docs) {
          return res.status(httpStatus.OK).send(docs);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Profiles Not Found.",
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
  getProfileInfo: async (req, res, next) => {
    const errTitle = "Error when getting profile info.";

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

    const reqFields = { ...publicRestrictedFields };
    const restrictedFieldNames = getValues(publicRestrictedFields, "");

    const keys = req.query.keys;

    if (keys) {
      keys.split(",").forEach((key) => {
        if (!restrictedFieldNames.includes(key)) {
          reqFields[key] = 1;
        }
      });
    }

    try {
      const profile = await ProfilesModel.findById(req.params.id, reqFields)
        .populate({
          path: "media",
          select: "cover_picture stars",
        })
        .populate({
          path: "projects",
          select: "project_title project_type project_cover_picture",
        })
        .populate({
          path: "connections",
          select: "profile_picture name professions connections",
        });

      if (profile) {
        let totalStars = 0;
        profile.media.forEach((media) => {
          totalStars += media.stars.length;
        });
        profile.set("total_stars", totalStars, { strict: false });

        return res.status(httpStatus.OK).send(profile);
      } else {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Profile Not Found.",
          })
        );
      }
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  postProfileInfo: async (req, res, next) => {
    const errTitle = "Error when posting profile info.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      name: Joi.string().min(3).required(),
      username: Joi.string().min(3).required(),
      bio: Joi.string().allow(null),
      professions: Joi.array()
        .items(Joi.string().valid(...getValues(professions, "role")))
        .min(1)
        .max(3)
        .required(),
      date_of_birth: Joi.date().allow(null),
      gender: Joi.string()
        .valid(...getValues(genders))
        .allow(null),
      height: Joi.object({
        unit: Joi.string()
          .valid(...getValues(units, ""))
          .required(),
        value: Joi.number().required(),
      }).allow(null),
      weight: Joi.object({
        unit: Joi.string()
          .valid(...getValues(units, ""))
          .required(),
        value: Joi.number().required(),
      }).allow(null),
      skills: Joi.array().items(Joi.string()).allow(null),
      education: Joi.array()
        .items(
          Joi.object({
            school: Joi.string().required(),
            degree: Joi.string().required(),
            grade: Joi.string()
              .valid(...getValues(grades, "code"))
              .required(),
            start: Joi.date(),
            end: Joi.date(),
            description: Joi.string(),
          })
        )
        .allow(null),
      languages: Joi.array()
        .items(Joi.string().valid(...getValues(languages, "code")))
        .allow(null),
      location: Joi.object({
        lat: Joi.number().required(),
        lon: Joi.number().required(),
      }).allow(null),
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
      const username = await ProfilesModel.findOne({
        _id: {
          $ne: req.body.profile_id,
        },
        username: req.body.username,
      });
      if (username) {
        return next(
          createHttpError(httpStatus.CONFLICT, {
            title: errTitle,
            message: "Username already taken.",
          })
        );
      }

      if (req.body.height) {
        req.body.height.absolute_value =
          req.body.height.value * units[req.body.height.unit].length.multi;

        req.body.height.unit = units[req.body.height.unit].length.unit;
      }
      if (req.body.weight) {
        req.body.weight.absolute_value =
          req.body.weight.value * units[req.body.weight.unit].length.multi;

        req.body.weight.unit = units[req.body.weight.unit].mass.unit;
      }
      if (req.body.education && req.body.education.length > 0) {
        req.body.education = req.body.education.map((education) => {
          const newEd = { ...education };
          newEd.gradeScore = getValues(grades).find(
            (grade) => grade.code === newEd.grade
          ).score;
          return newEd;
        });
      }

      const profile = await ProfilesModel.findByIdAndUpdate(
        req.body.profile_id,
        req.body,
        {
          new: true,
          fields: profileRestrictedFields,
        }
      );

      return res.status(httpStatus.OK).send(profile);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  updateProfileInfo: async (req, res, next) => {
    const errTitle = "Error when updating profile info.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      name: Joi.string().min(3),
      username: Joi.string().min(3),
      bio: Joi.string(),
      professions: Joi.array()
        .items(Joi.string().valid(...getValues(professions, "role")))
        .min(1),
      date_of_birth: Joi.date(),
      gender: Joi.string().valid(...getValues(genders)),
      height: Joi.object({
        unit: Joi.string()
          .valid(...getValues(units, ""))
          .required(),
        value: Joi.number().required(),
      }),
      weight: Joi.object({
        unit: Joi.string()
          .valid(...getValues(units, ""))
          .required(),
        value: Joi.number().required(),
      }),
      skills: Joi.array().items(Joi.string()),
      education: Joi.array().items(
        Joi.object({
          school: Joi.string().required(),
          degree: Joi.string().required(),
          grade: Joi.string()
            .valid(...getValues(grades, "code"))
            .required(),
          start: Joi.date(),
          end: Joi.date(),
          description: Joi.string(),
        })
      ),
      languages: Joi.array().items(
        Joi.string().valid(...getValues(languages, "code"))
      ),
      location: Joi.object({
        lat: Joi.number().required(),
        lon: Joi.number().required(),
      }),
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
      const username = await ProfilesModel.findOne({
        _id: {
          $ne: req.body.profile_id,
        },
        username: req.body.username,
      });
      if (username) {
        return next(
          createHttpError(httpStatus.CONFLICT, {
            title: errTitle,
            message: "Username already taken.",
          })
        );
      }

      if (req.body.height) {
        req.body.height.absolute_value =
          req.body.height.value * units[req.body.height.unit].length.multi;

        req.body.height.unit = units[req.body.height.unit].length.unit;
      }
      if (req.body.weight) {
        req.body.weight.absolute_value =
          req.body.weight.value * units[req.body.weight.unit].length.multi;

        req.body.weight.unit = units[req.body.weight.unit].mass.unit;
      }
      if (req.body.education && req.body.education.length > 0) {
        req.body.education = req.body.education.map((education) => {
          const newEd = { ...education };
          newEd.gradeScore = getValues(grades).find(
            (grade) => grade.code === newEd.grade
          ).score;
          return newEd;
        });
      }

      const profile = await ProfilesModel.findByIdAndUpdate(
        req.body.profile_id,
        req.body,
        {
          new: true,
          fields: profileRestrictedFields,
        }
      );

      return res.status(httpStatus.OK).send(profile);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  getConnections: async (req, res, next) => {
    const errTitle = "Error when getting connections.";

    ProfilesModel.findById(req.params.id)
      .select("connections")
      .populate({
        path: "connections",
        select: "profile_picture name professions",
      })
      .then((profile) => {
        return res.status(httpStatus.OK).send(profile.connections);
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
  addConnectionRequest: async (req, res, next) => {
    const errTitle = "Error when adding connection request.";

    if (!req.query.connectID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Connection Profile ID is required in query.",
        })
      );
    } else if (!isObjectIdValid(req.query.connectID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Connection Profile ID is not a valid Object ID.",
        })
      );
    }

    try {
      const profile = await ProfilesModel.findById(req.params.id);
      const profile2 = await ProfilesModel.findById(req.query.connectID);

      if (!profile2) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Profile Not Found.",
          })
        );
      }

      if (profile.connections.includes(req.query.connectID)) {
        return next(
          createHttpError(httpStatus.CONFLICT, {
            title: errTitle,
            message: "The other user is already a connection.",
          })
        );
      }
      if (profile.blocked_profiles.includes(req.query.connectID)) {
        return next(
          createHttpError(httpStatus.FORBIDDEN, {
            title: errTitle,
            message: "You cannot send a connection request to a blocked user.",
          })
        );
      }
      if (profile2.blocked_profiles.includes(req.params.id)) {
        return next(
          createHttpError(httpStatus.FORBIDDEN, {
            title: errTitle,
            message: "The user has blocked you.",
          })
        );
      }

      const checkPending = await ConnectionsPendingModel.findOne({
        $or: [
          {
            from: req.query.connectID,
            to: req.params.id,
          },
          {
            from: req.params.id,
            to: req.query.connectID,
          },
        ],
        status: connectionStatuses.PENDING,
      });
      if (checkPending) {
        return next(
          createHttpError(httpStatus.CONFLICT, {
            title: errTitle,
            message: "A Connection request already exists.",
          })
        );
      }

      const connectPending = await new ConnectionsPendingModel({
        from: req.params.id,
        to: req.query.connectID,
      }).save();

      // Send Notification to requested profile
      const notif_profiles = [connectPending.to.toString()];
      const profile_from = connectPending.from.toString();
      const notification = {
        profiles: notif_profiles.map((id) => id.toString()),
        type: notificationTypes.CONNECTION_REQUEST,
        message: `@{profile:${profile_from}} sent you a connection request`,
        action: `/profile/${profile_from}`,
        mentioned_profiles: [profile_from].map((id) => id.toString()),
      };

      await NotificationsController.pushNotification(notification);

      return res.status(httpStatus.OK).send(connectPending);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  removeConnection: async (req, res, next) => {
    const errTitle = "Error when removing connection request.";

    if (!req.query.connectID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Connection Profile ID is required in query.",
        })
      );
    } else if (!isObjectIdValid(req.query.connectID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Connection Profile ID is not a valid Object ID.",
        })
      );
    }

    try {
      await ProfilesModel.findByIdAndUpdate(
        req.params.id,
        {
          $pull: {
            connections: req.query.connectID,
          },
        },
        { new: true }
      );

      const profile2 = await ProfilesModel.findByIdAndUpdate(
        req.query.connectID,
        {
          $pull: {
            connections: req.params.id,
          },
        },
        { new: true }
      );

      if (!profile2) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Profile Not Found.",
          })
        );
      }

      return res.status(httpStatus.OK).send({
        message: "Connection Removed.",
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
  getPendingConnections: async (req, res, next) => {
    const errTitle = "Error when getting pending connection requests.";

    ConnectionsPendingModel.find({
      $or: [
        {
          to: req.params.id,
        },
        {
          from: req.params.id,
        },
      ],
      status: connectionStatuses.PENDING,
    })
      .sort("-createdAt")
      .populate({
        path: "to",
        select: "profile_picture name",
      })
      .populate({
        path: "from",
        select: "profile_picture name",
      })
      .exec()
      .then((docs) => {
        if (docs) {
          return res.status(httpStatus.OK).send(docs);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Pending Connections Not Found.",
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
  resolveConnectionRequest: async (req, res, next) => {
    const errTitle = "Error when resolving connection request.";

    if (!req.query.reqID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Request ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.reqID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Request ID is not a valid Object ID.",
        })
      );
    }

    if (
      !req.query.response ||
      ![connectionStatuses.ACCEPTED, connectionStatuses.REJECTED].includes(
        req.query.response
      )
    ) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Response is not valid.",
        })
      );
    }

    try {
      const connectPending = await ConnectionsPendingModel.findOneAndUpdate(
        {
          _id: req.query.reqID,
          to: req.params.id,
          status: connectionStatuses.PENDING,
        },
        {
          status: req.query.response,
          resolvedAt: new Date(),
        },
        { new: true }
      );

      if (!connectPending) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Connection Request not found.",
          })
        );
      }

      if (req.query.response === connectionStatuses.ACCEPTED) {
        await ProfilesModel.findByIdAndUpdate(
          connectPending.from,
          {
            $addToSet: {
              connections: connectPending.to,
            },
          },
          { new: true }
        );
        await ProfilesModel.findByIdAndUpdate(
          connectPending.to,
          {
            $addToSet: {
              connections: connectPending.from,
            },
          },
          { new: true }
        );

        return res.status(httpStatus.OK).send({
          connect_id: connectPending.from,
          message: `Connection added with ${connectPending.from}.`,
        });
      }

      return res.status(httpStatus.OK).send({
        message: "Connection Rejected.",
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
  removeConnectionRequest: async (req, res, next) => {
    const errTitle = "Error when removing connection request.";

    if (!req.query.reqID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Request ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.reqID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Request ID is not a valid Object ID.",
        })
      );
    }

    try {
      const connectPending = await ConnectionsPendingModel.findOne({
        _id: req.query.reqID,
        from: req.params.id,
        status: connectionStatuses.PENDING,
      });

      if (!connectPending) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Connection Request not found.",
          })
        );
      }

      await ConnectionsPendingModel.findByIdAndUpdate(
        connectPending._id,
        {
          status: connectionStatuses.CANCELLED,
          resolvedAt: new Date(),
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send(connectPending);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  uploadAvatar: async (req, res, next) => {
    const errTitle = "Error when uploading avatar.";

    if (!req.file) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "No avatar provided.",
        })
      );
    }

    try {
      const profile = await ProfilesModel.findByIdAndUpdate(
        req.params.id,
        {
          profile_picture: req.file,
        },
        {
          new: true,
          fields: profileRestrictedFields,
        }
      );

      return res.status(httpStatus.OK).send(profile);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  deleteAvatar: async (req, res, next) => {
    const errTitle = "Error when deleting avatar.";

    try {
      const profile = await ProfilesModel.findByIdAndUpdate(
        req.params.id,
        {
          profile_picture: null,
        },
        {
          new: true,
          fields: profileRestrictedFields,
        }
      );

      return res.status(httpStatus.OK).send(profile);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  uploadCoverPic: async (req, res, next) => {
    const errTitle = "Error when uploading cover picture.";

    if (!req.file) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "No cover picture provided.",
        })
      );
    }

    try {
      const profile = await ProfilesModel.findByIdAndUpdate(
        req.params.id,
        {
          cover_picture: req.file,
        },
        {
          new: true,
          fields: profileRestrictedFields,
        }
      );

      return res.status(httpStatus.OK).send(profile);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  deleteCoverPic: async (req, res, next) => {
    const errTitle = "Error when deleting cover picture.";

    try {
      const profile = await ProfilesModel.findByIdAndUpdate(
        req.params.id,
        {
          cover_picture: null,
        },
        {
          new: true,
          fields: profileRestrictedFields,
        }
      );

      return res.status(httpStatus.OK).send(profile);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  getBlockedProfiles: async (req, res, next) => {
    const errTitle = "Error when getting blocked profiles.";

    try {
      const profile = await ProfilesModel.findById(req.params.id).select(
        "blocked_profiles"
      );

      let blockedProfiles;
      if (req.query.populate) {
        const popProfile = await profile
          .populate({
            path: "blocked_profiles",
            select: "profile_picture name professions",
          })
          .execPopulate();
        blockedProfiles = popProfile.blocked_profiles;
      } else {
        blockedProfiles = profile.blocked_profiles;
      }

      res.status(httpStatus.OK).send(blockedProfiles);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  blockProfile: async (req, res, next) => {
    const errTitle = "Error when blocking profile.";

    if (!req.query.blockID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Block Profile ID is required in query.",
        })
      );
    } else if (!isObjectIdValid(req.query.blockID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Block Profile ID is not a valid Object ID.",
        })
      );
    }

    try {
      const blockedProfile = await ProfilesModel.findById(req.query.blockID);
      if (!blockedProfile) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Profile Not Found.",
          })
        );
      }

      const checkPending1 = await ConnectionsPendingModel.findOne({
        from: req.query.blockID,
        to: req.params.id,
        status: connectionStatuses.PENDING,
      });
      if (checkPending1) {
        await ConnectionsPendingModel.findByIdAndUpdate(
          checkPending1._id,
          {
            status: connectionStatuses.REJECTED,
            resolvedAt: new Date(),
          },
          { new: true }
        );
      }
      const checkPending2 = await ConnectionsPendingModel.findOne({
        from: req.params.id,
        to: req.query.blockID,
        status: connectionStatuses.PENDING,
      });
      if (checkPending2) {
        await ConnectionsPendingModel.findByIdAndUpdate(
          checkPending2._id,
          {
            status: connectionStatuses.CANCELLED,
            resolvedAt: new Date(),
          },
          { new: true }
        );
      }

      const profile = await ProfilesModel.findById(req.params.id);
      if (profile.connections.includes(req.query.blockID)) {
        await ProfilesModel.findByIdAndUpdate(
          req.query.blockID,
          {
            $pull: {
              connections: req.params.id,
            },
          },
          { new: true }
        );

        await ProfilesModel.findByIdAndUpdate(
          req.params.id,
          {
            $pull: {
              connections: req.query.blockID,
            },
          },
          { new: true }
        );
      }

      await ProfilesModel.findByIdAndUpdate(
        req.params.id,
        {
          $addToSet: {
            blocked_profiles: req.query.blockID,
          },
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send({
        message: "Profile Blocked.",
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
  unBlockProfile: async (req, res, next) => {
    const errTitle = "Error when un-blocking profile.";

    if (!req.query.blockID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Block Profile ID is required in query",
        })
      );
    } else if (!isObjectIdValid(req.query.blockID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Block Profile ID is not a valid Object ID.",
        })
      );
    }

    try {
      await ProfilesModel.findByIdAndUpdate(
        req.params.id,
        {
          $pull: {
            blocked_profiles: req.query.blockID,
          },
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send({
        message: "Profile UnBlocked.",
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
  validateUserName: async (req, res, next) => {
    const errTitle = "Error when validating user name.";

    if (!req.query.username) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "User Name is required in query.",
        })
      );
    }

    try {
      const username = await ProfilesModel.findOne({
        _id: {
          $ne: req.params.id,
        },
        username: req.query.username,
      });
      if (username) {
        return next(
          createHttpError(httpStatus.CONFLICT, {
            title: errTitle,
            message: "Username already taken.",
          })
        );
      }

      return res.status(httpStatus.OK).send({
        valid: true,
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
};
