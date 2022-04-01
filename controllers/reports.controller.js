const Joi = require("@hapi/joi");
const createHttpError = require("http-errors");
const {
  ReportsModel,
  ProfilesModel,
  ProjectsModel,
  MediaModel,
  CommentsModel,
} = require("../models");
const { isObjectIdValid } = require("../utils/common_utils");
const httpStatus = require("../utils/http_status_codes");

module.exports = {
  getReports: async (req, res, next) => {
    const errTitle = "Error when getting reports.";

    try {
      const reports = await ReportsModel.find();

      return res.status(httpStatus.OK).send(reports);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  reportProfile: async (req, res, next) => {
    const errTitle = "Error when reporting profile.";

    const reqSchema = Joi.object({
      profile_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Profile ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
      reason: Joi.string().required(),
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
      const profile = await ProfilesModel.findById(req.body.profile_id);

      if (!profile) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Profile Not Found.",
          })
        );
      }

      const report = await ReportsModel.findOne({
        profile: req.body.profile_id,
        by: req.params.id,
        resolved: false,
      });

      if (report) {
        return next(
          createHttpError(httpStatus.CONFLICT, {
            title: errTitle,
            message: "Already Reported.",
          })
        );
      }

      await new ReportsModel({
        profile: req.body.profile_id,
        by: req.params.id,
        reason: req.body.reason,
      }).save();

      return res.status(httpStatus.OK).send({
        reported: true,
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
  reportProject: async (req, res, next) => {
    const errTitle = "Error when reporting project.";

    const reqSchema = Joi.object({
      project_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Project ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
      reason: Joi.string().required(),
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
      const project = await ProjectsModel.findById(req.body.project_id);

      if (!project) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Project Not Found.",
          })
        );
      }

      const report = await ReportsModel.findOne({
        project: req.body.project_id,
        by: req.params.id,
        resolved: false,
      });

      if (report) {
        return next(
          createHttpError(httpStatus.CONFLICT, {
            title: errTitle,
            message: "Already Reported.",
          })
        );
      }

      await new ReportsModel({
        project: req.body.project_id,
        by: req.params.id,
        reason: req.body.reason,
      }).save();

      return res.status(httpStatus.OK).send({
        reported: true,
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
  reportMedia: async (req, res, next) => {
    const errTitle = "Error when reporting media.";

    const reqSchema = Joi.object({
      media_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Media ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
      reason: Joi.string().required(),
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
      const media = await MediaModel.findById(req.body.media_id);

      if (!media) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Media Not Found.",
          })
        );
      }

      const report = await ReportsModel.findOne({
        media: req.body.media_id,
        by: req.params.id,
        resolved: false,
      });

      if (report) {
        return next(
          createHttpError(httpStatus.CONFLICT, {
            title: errTitle,
            message: "Already Reported.",
          })
        );
      }

      await new ReportsModel({
        media: req.body.media_id,
        by: req.params.id,
        reason: req.body.reason,
      }).save();

      return res.status(httpStatus.OK).send({
        reported: true,
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
  reportComment: async (req, res, next) => {
    const errTitle = "Error when reporting comment.";

    const reqSchema = Joi.object({
      comment_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Comment ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
      reason: Joi.string().required(),
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
      const comment = await CommentsModel.findById(req.body.comment_id);

      if (!comment) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Comment Not Found.",
          })
        );
      }

      const report = await ReportsModel.findOne({
        comment: req.body.comment_id,
        by: req.params.id,
        resolved: false,
      });

      if (report) {
        return next(
          createHttpError(httpStatus.CONFLICT, {
            title: errTitle,
            message: "Already Reported.",
          })
        );
      }

      await new ReportsModel({
        comment: req.body.comment_id,
        by: req.params.id,
        reason: req.body.reason,
      }).save();

      return res.status(httpStatus.OK).send({
        reported: true,
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
  resolveReport: async (req, res, next) => {
    const errTitle = "Error when resolving report.";

    if (!req.query.report_id) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Report ID is required in query.",
        })
      );
    } else if (!isObjectIdValid(req.query.report_id)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Report ID is not a valid Object ID.",
        })
      );
    }

    try {
      const report = await ReportsModel.findByIdAndUpdate(
        req.query.report_id,
        {
          resolved: {
            resolved_by: req.params.id,
            resolved_at: new Date(),
          },
        },
        { new: true }
      );

      if (!report) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Report Not Found.",
          })
        );
      }

      return res.status(httpStatus.OK).send(report);
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
