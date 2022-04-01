const Joi = require("@hapi/joi");
const createHttpError = require("http-errors");
const httpStatus = require("../utils/http_status_codes");
const { ApplicationsModel, JobsModel, ProfilesModel } = require("../models");
const { professions } = require("../constants");
const { isObjectIdValid, getValues } = require("../utils/common_utils");

module.exports = {
  getProfileApplications: (req, res, next) => {
    const errTitle = "Error when getting profile applications.";

    ApplicationsModel.find({ profile: req.params.id })
      .populate({
        path: "job",
        populate: [
          { path: "profile", select: "profile_picture name" },
          {
            path: "cast_roles",
            select: "role",
          },
          {
            path: "crew_roles",
            select: "role",
          },
        ],
      })
      .exec()
      .then((docs) => {
        if (docs) {
          return res.status(httpStatus.OK).send(docs);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Applications Not Found.",
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
  getJobApplications: (req, res, next) => {
    const errTitle = "Error when getting job applications.";

    ApplicationsModel.find({ job: req.query.jobID })
      .populate({
        path: "profile",
        select: "profile_picture name professions",
      })
      .exec()
      .then((docs) => {
        if (docs) {
          return res.status(httpStatus.OK).send(docs);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Applications Not Found.",
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
  getApplication: (req, res, next) => {
    const errTitle = "Error when getting application.";

    if (!req.query.applicationID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Application ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.applicationID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Application ID is not a valid Object ID.",
        })
      );
    }

    ApplicationsModel.findOne({
      _id: req.query.applicationID,
      profile: req.params.id,
    })
      .exec()
      .then((doc) => {
        if (doc) {
          return res.status(httpStatus.OK).send(doc);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Application Not Found.",
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
  postApplication: async (req, res, next) => {
    const errTitle = "Error when posting application.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      job_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Job ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
      applying_for: Joi.string()
        .valid(...getValues(professions, "role"))
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
      const newApplication = { ...req.body };
      newApplication.profile = req.body.profile_id;
      delete newApplication.profile_id;
      newApplication.job = req.body.job_id;
      delete newApplication.job_id;

      const job = await JobsModel.findOne({
        _id: newApplication.job,
        closed: false,
      })
        .select("cast_roles crew_roles")
        .populate("cast_roles")
        .populate("crew_roles")
        .populate("applications");

      if (!job) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Job Not Found.",
          })
        );
      }

      const isCast = job.cast_roles.find(
        (role) => role.role === newApplication.applying_for
      );
      const isCrew = job.crew_roles.find(
        (role) => role.role === newApplication.applying_for
      );
      if (!isCast && !isCrew) {
        return next(
          createHttpError(httpStatus.BAD_REQUEST, {
            title: errTitle,
            message: "Applied role not mentioned in the job.",
          })
        );
      }

      const alreadyApplied = job.applications.find(
        (appl) => appl.profile.toString() === newApplication.profile
      );
      if (alreadyApplied) {
        return next(
          createHttpError(httpStatus.BAD_REQUEST, {
            title: errTitle,
            message: "Job already applied.",
          })
        );
      }

      const application = await new ApplicationsModel(newApplication).save();

      await JobsModel.findByIdAndUpdate(
        application.job,
        {
          $addToSet: {
            applications: application._id,
          },
        },
        { new: true }
      );

      await ProfilesModel.findByIdAndUpdate(
        application.profile,
        {
          $addToSet: {
            jobs_applied: application._id,
          },
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send(application);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  removeApplication: async (req, res, next) => {
    const errTitle = "Error when removing application.";

    if (!req.query.applicationID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Job ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.applicationID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Application ID is not a valid Object ID.",
        })
      );
    }

    try {
      const application = await ApplicationsModel.findOneAndDelete({
        _id: req.query.applicationID,
        profile: req.params.id,
      });

      if (!application) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Application Not Found.",
          })
        );
      }

      await JobsModel.findByIdAndUpdate(
        application.job,
        {
          $pull: {
            applications: application._id,
          },
        },
        { new: true }
      );

      await ProfilesModel.findByIdAndUpdate(
        application.profile,
        {
          $pull: {
            jobs_applied: application._id,
          },
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send(application);
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
