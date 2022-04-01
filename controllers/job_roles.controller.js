const Joi = require("@hapi/joi");
const createHttpError = require("http-errors");
const httpStatus = require("../utils/http_status_codes");
const { JobsModel, CastRolesModel, CrewRolesModel } = require("../models");
const {
  professions,
  deptSections,
  genders,
  languages,
} = require("../constants");
const { isObjectIdValid, getValues } = require("../utils/common_utils");

module.exports = {
  getJobRoles: async (req, res, next) => {
    const errTitle = "Error when getting job roles.";

    JobsModel.findOne({ _id: req.params.job_id })
      .select("cast_roles crew_roles")
      .populate("cast_roles")
      .populate("crew_roles")
      .then((job) => {
        if (job) {
          return res.status(httpStatus.OK).send(job);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Job Role Not Found.",
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
  getJobRole: async (req, res, next) => {
    const errTitle = "Error when getting job role.";

    if (!req.query.jobRoleID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Job Role ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.jobRoleID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Job Role ID is not a valid Object ID.",
        })
      );
    }

    JobsModel.findOne({ _id: req.params.job_id })
      .select("cast_roles crew_roles")
      .then(async (job) => {
        const isCast = job.cast_roles.find(
          (role) => role.toString() === req.query.jobRoleID
        );
        const isCrew = job.crew_roles.find(
          (role) => role.toString() === req.query.jobRoleID
        );

        let jobRole;
        if (isCast) {
          jobRole = await CastRolesModel.findOne({
            _id: req.query.jobRoleID,
            job: req.query.jobID,
          });
        }
        if (isCrew) {
          jobRole = await CrewRolesModel.findOne({
            _id: req.query.jobRoleID,
            job: req.query.jobID,
          });
        }

        if (!jobRole) {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Job Role Not Found.",
            })
          );
        }

        return res.status(httpStatus.OK).send(jobRole);
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
  addCastRole: async (req, res, next) => {
    const errTitle = "Error when adding cast role.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      job_id: Joi.string().required(),
      role: Joi.string()
        .valid(
          ...getValues(professions, "role", { section: deptSections.CAST })
        )
        .required(),
      payment: Joi.number().allow(null),
      description: Joi.string(),
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
      const newCastRole = { ...req.body };
      newCastRole.job = req.body.job_id;
      delete newCastRole.job_id;
      delete newCastRole.profile_id;

      const castRole = await new CastRolesModel(newCastRole).save();

      await JobsModel.findByIdAndUpdate(
        castRole.job,
        {
          $push: {
            cast_roles: castRole._id,
          },
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send(castRole);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  updateCastRole: async (req, res, next) => {
    const errTitle = "Error when updating cast role.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      job_id: Joi.string().required(),
      role_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Job Role ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
      role: Joi.string().valid(
        ...getValues(professions, "role", { section: deptSections.CAST })
      ),
      payment: Joi.number().allow(null),
      description: Joi.string(),
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
      const newCastRole = { ...req.body };
      delete newCastRole.role_id;
      delete newCastRole.job_id;
      delete newCastRole.profile_id;

      const castRole = await CastRolesModel.findByIdAndUpdate(
        req.body.role_id,
        newCastRole,
        { new: true }
      );

      return res.status(httpStatus.OK).send(castRole);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  addCrewRole: async (req, res, next) => {
    const errTitle = "Error when adding crew role.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      job_id: Joi.string().required(),
      role: Joi.string()
        .valid(
          ...getValues(professions, "role", { section: deptSections.CREW })
        )
        .required(),
      payment: Joi.number().allow(null),
      description: Joi.string(),
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
      const newCrewRole = { ...req.body };
      newCrewRole.job = req.body.job_id;
      delete newCrewRole.job_id;
      delete newCrewRole.profile_id;

      const crewRole = await new CrewRolesModel(newCrewRole).save();

      await JobsModel.findByIdAndUpdate(
        crewRole.job,
        {
          $push: {
            crew_roles: crewRole._id,
          },
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send(crewRole);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  updateCrewRole: async (req, res, next) => {
    const errTitle = "Error when updating crew role.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      job_id: Joi.string().required(),
      role_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Job Role ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
      role: Joi.string().valid(
        ...getValues(professions, "role", { section: deptSections.CREW })
      ),
      payment: Joi.number().allow(null),
      description: Joi.string(),
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
      const newCrewRole = { ...req.body };
      delete newCrewRole.role_id;
      delete newCrewRole.job_id;
      delete newCrewRole.profile_id;

      const crewRole = await CrewRolesModel.findByIdAndUpdate(
        req.body.role_id,
        newCrewRole,
        { new: true }
      );

      return res.status(httpStatus.OK).send(crewRole);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  removeJobRole: async (req, res, next) => {
    const errTitle = "Error when removing job role.";

    if (!req.query.jobRoleID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Job Role ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.jobRoleID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Job Role ID is not a valid Object ID.",
        })
      );
    }

    JobsModel.findOne({ _id: req.query.jobID, profile: req.params.id })
      .select("cast_roles crew_roles")
      .then(async (job) => {
        const isCast = job.cast_roles.find(
          (role) => role.toString() === req.query.jobRoleID
        );
        const isCrew = job.crew_roles.find(
          (role) => role.toString() === req.query.jobRoleID
        );

        let jobRole;
        if (isCast) {
          jobRole = await CastRolesModel.findOneAndDelete({
            _id: req.query.jobRoleID,
            job: req.query.jobID,
          });
          await JobsModel.findByIdAndUpdate(
            req.query.jobID,
            {
              $pull: {
                cast_roles: req.query.jobRoleID,
              },
            },
            { new: true }
          );
        }
        if (isCrew) {
          jobRole = await CrewRolesModel.findOneAndDelete({
            _id: req.query.jobRoleID,
            job: req.query.jobID,
          });
          await JobsModel.findByIdAndUpdate(
            req.query.jobID,
            {
              $pull: {
                crew_roles: req.query.jobRoleID,
              },
            },
            { new: true }
          );
        }

        if (!jobRole) {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Job Role Not Found.",
            })
          );
        }

        return res.status(httpStatus.OK).send(jobRole);
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
};
