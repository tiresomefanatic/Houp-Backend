const fs = require("fs");
const path = require("path");
const Joi = require("@hapi/joi");
const createHttpError = require("http-errors");
const httpStatus = require("../utils/http_status_codes");
const {
  JobsModel,
  ProfilesModel,
  ProjectsModel,
  CastRolesModel,
  CrewRolesModel,
} = require("../models");
const { projectTypes, professions, deptSections } = require("../constants");
const { isObjectIdValid, getValues } = require("../utils/common_utils");

module.exports = {
  getJobs: async (req, res, next) => {
    const errTitle = "Error when getting jobs.";

    JobsModel.find({ closed: false })
      .select({ applications: 0 })
      .populate({
        path: "profile",
        select: "profile_picture name",
      })
      .exec()
      .then((docs) => {
        if (docs) {
          return res.status(httpStatus.OK).send(docs);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              type: errTitle,
              message: "Jobs Not Found.",
            })
          );
        }
      })
      .catch((error) => {
        return next(
          createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
            type: errTitle,
            message: error,
          })
        );
      });
  },
  getRelatedJobs: async (req, res, next) => {
    const errTitle = "Error when getting related jobs.";

    const roles = req.query.roles.split(",");

    const castRoles = roles.filter((role) =>
      getValues(professions, "role", { section: deptSections.CAST }).includes(
        role
      )
    );
    const crewRoles = roles.filter((role) =>
      getValues(professions, "role", { section: deptSections.CREW }).includes(
        role
      )
    );

    JobsModel.find({ closed: false })
      .select({ applications: 0 })
      .populate({
        path: "profile",
        select: "profile_picture name",
      })
      .populate({
        path: "cast_roles",
        match: {
          role: castRoles,
        },
      })
      .populate({
        path: "crew_roles",
        match: {
          role: crewRoles,
        },
      })
      .exec()
      .then((docs) => {
        if (docs) {
          docs = docs.filter(
            (doc) => doc.cast_roles.length || doc.crew_roles.length
          );

          return res.status(httpStatus.OK).send(docs);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              type: errTitle,
              message: "Jobs Not Found.",
            })
          );
        }
      })
      .catch((error) => {
        return next(
          createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
            type: errTitle,
            message: error,
          })
        );
      });
  },
  getPostedJobs: async (req, res, next) => {
    const errTitle = "Error when getting jobs posted.";

    if (!req.params.id) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          type: errTitle,
          message: "Profile ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.params.id)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          type: errTitle,
          message: "Profile ID is not a valid Object ID.",
        })
      );
    }

    const reqObj = { profile: req.params.id };
    if (req.query.closed) {
      reqObj.closed = req.query.closed !== "false";
    }

    JobsModel.find(reqObj)
      .populate({
        path: "cast_roles",
        select: "role",
      })
      .populate({
        path: "crew_roles",
        select: "role",
      })
      .exec()
      .then((docs) => {
        if (docs) {
          return res.status(httpStatus.OK).send(docs);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              type: errTitle,
              message: "Jobs Not Found.",
            })
          );
        }
      })
      .catch((error) => {
        return next(
          createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
            type: errTitle,
            message: error,
          })
        );
      });
  },
  getJob: async (req, res, next) => {
    const errTitle = "Error when getting job.";

    if (!req.params.job_id) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          type: errTitle,
          message: "Job ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.params.job_id)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          type: errTitle,
          message: "Job ID is not a valid Object ID.",
        })
      );
    }

    JobsModel.findById(req.params.job_id)
      .select({ applications: 0 })
      .populate({
        path: "project",
        select: "project_views",
      })
      .populate({
        path: "profile",
        select: "profile_picture name professions",
      })
      .populate("cast_roles")
      .populate("crew_roles")
      .exec()
      .then((doc) => {
        if (doc) {
          return res.status(httpStatus.OK).send(doc);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              type: errTitle,
              message: "Jobs Not Found.",
            })
          );
        }
      })
      .catch((error) => {
        return next(
          createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
            type: errTitle,
            message: error,
          })
        );
      });
  },
  openJob: async (req, res, next) => {
    const errTitle = "Error when posting job.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      project_id: Joi.string().custom((value, helper) => {
        if (!isObjectIdValid(value)) {
          return helper.error("Project ID is not a valid Object ID.");
        }
        return value;
      }),
      project_title: Joi.string().required(),
      project_description: Joi.string(),
      project_type: Joi.string()
        .valid(...getValues(projectTypes))
        .required(),
    });
    const { error } = reqSchema.validate(req.body);
    if (error) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          type: errTitle,
          message: error.details[0].message,
        })
      );
    }

    try {
      const newJob = { ...req.body };
      newJob.profile = req.body.profile_id;
      delete newJob.profile_id;
      newJob.project = newJob.project_id;
      delete newJob.project_id;
      newJob.project_cover_picture = req.file;
      newJob.date = new Date();

      if (newJob.project) {
        const project = await ProjectsModel.findOne({
          _id: newJob.project,
          $or: [
            {
              profile: newJob.profile,
            },
            {
              project_admins: newJob.profile,
            },
          ],
        });
        if (!project) {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Project not found.",
            })
          );
        }
      }

      const job = await new JobsModel(newJob).save();

      await ProfilesModel.findByIdAndUpdate(
        newJob.profile,
        {
          $push: {
            jobs_posted: job._id,
          },
        },
        { new: true }
      );

      if (job.project) {
        await ProjectsModel.findByIdAndUpdate(
          job.project,
          {
            $push: {
              project_jobs: job._id,
            },
          },
          { new: true }
        );
      }

      return res.status(httpStatus.OK).send(job);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          type: errTitle,
          message: e,
        })
      );
    }
  },
  updateJob: async (req, res, next) => {
    const errTitle = "Error when updating job.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      job_id: Joi.string().required(),
      project_title: Joi.string(),
      project_description: Joi.string(),
      project_type: Joi.string().valid(...getValues(projectTypes)),
      audition_date: Joi.date(),
      audition_location: Joi.object({
        lat: Joi.number().required(),
        lon: Joi.number().required(),
      }),
      audition_address: Joi.string().allow(""),
      close_posting_on: Joi.date(),
      cast_roles: Joi.array().items(
        Joi.object({
          role_id: Joi.string().custom((value, helper) => {
            if (!isObjectIdValid(value)) {
              return helper.error("Role ID is not a valid Object ID.");
            }
            return value;
          }),
          role: Joi.string()
            .valid(
              ...getValues(professions, "role", { section: deptSections.CAST })
            )
            .required(),
          payment: Joi.number().allow(null),
          description: Joi.string().allow("").required(),
        })
      ),
      crew_roles: Joi.array().items(
        Joi.object({
          role_id: Joi.string().custom((value, helper) => {
            if (!isObjectIdValid(value)) {
              return helper.error("Role ID is not a valid Object ID.");
            }
            return value;
          }),
          role: Joi.string()
            .valid(
              ...getValues(professions, "role", { section: deptSections.CREW })
            )
            .required(),
          payment: Joi.number().allow(null),
          description: Joi.string().allow("").required(),
        })
      ),
    });
    const { error } = reqSchema.validate(req.body);
    if (error) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          type: errTitle,
          message: error.details[0].message,
        })
      );
    }

    try {
      const newJob = { ...req.body };
      delete newJob.profile_id;
      delete newJob.job_id;
      newJob.project_cover_picture = req.file;

      if (
        (!newJob.cast_roles && !newJob.crew_roles) ||
        (newJob.length === 0 && newJob.length === 0)
      ) {
        // return next(
        //   createHttpError(httpStatus.BAD_REQUEST, {
        //     type: errTitle,
        //     message: "Please provide at least one role for the job.",
        //   })
        // );
      }

      if (newJob.cast_roles) {
        newJob.cast_roles
          .filter((role) => role.role_id)
          .forEach(async (role) => {
            await CastRolesModel.findByIdAndUpdate(
              role.role_id,
              {
                role: role.role,
                payment: role.payment,
                description: role.description,
              },
              { new: true }
            );
          });
        const oldCastRoles1 = await CastRolesModel.find({
          job: req.body.job_id,
        });
        oldCastRoles1
          .filter(
            (role) =>
              !newJob.cast_roles.find(
                (rl) => rl.role === role.role && rl.role_id
              )
          )
          .forEach(async (role) => {
            await CastRolesModel.findOneAndDelete({
              _id: role._id,
              job: req.body.job_id,
            });

            await JobsModel.findByIdAndUpdate(
              role.job,
              {
                $pull: {
                  cast_roles: role._id,
                },
              },
              { new: true }
            );
          });
        const oldCastRoles2 = await CastRolesModel.find({
          job: req.body.job_id,
        });
        newJob.cast_roles
          .filter((role) => !oldCastRoles2.find((rl) => rl.role === role.role))
          .forEach(async (role) => {
            const castRole = await new CastRolesModel({
              job: req.body.job_id,
              role: role.role,
              payment: role.payment,
              description: role.description,
            }).save();

            await JobsModel.findByIdAndUpdate(
              castRole.job,
              {
                $push: {
                  cast_roles: castRole._id,
                },
              },
              { new: true }
            );
          });

        delete newJob.cast_roles;
      }

      if (newJob.crew_roles) {
        newJob.crew_roles
          .filter((role) => role.role_id)
          .forEach(async (role) => {
            await CrewRolesModel.findByIdAndUpdate(
              role.role_id,
              {
                role: role.role,
                payment: role.payment,
                description: role.description,
              },
              { new: true }
            );
          });
        const oldCrewRoles1 = await CrewRolesModel.find({
          job: req.body.job_id,
        });
        oldCrewRoles1
          .filter(
            (role) =>
              !newJob.crew_roles.find(
                (rl) => rl.role === role.role && rl.role_id
              )
          )
          .forEach(async (role) => {
            await CrewRolesModel.findOneAndDelete({
              _id: role._id,
              job: req.body.job_id,
            });

            await JobsModel.findByIdAndUpdate(
              role.job,
              {
                $pull: {
                  crew_roles: role._id,
                },
              },
              { new: true }
            );
          });
        const oldCrewRoles2 = await CrewRolesModel.find({
          job: req.body.job_id,
        });
        newJob.crew_roles
          .filter((role) => !oldCrewRoles2.find((rl) => rl.role === role.role))
          .forEach(async (role) => {
            const crewRole = await new CrewRolesModel({
              job: req.body.job_id,
              role: role.role,
              payment: role.payment,
              description: role.description,
            }).save();

            await JobsModel.findByIdAndUpdate(
              crewRole.job,
              {
                $push: {
                  crew_roles: crewRole._id,
                },
              },
              { new: true }
            );
          });

        delete newJob.crew_roles;
      }

      const job = await JobsModel.findByIdAndUpdate(req.body.job_id, newJob, {
        new: true,
      });

      return res.status(httpStatus.OK).send(job);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          type: errTitle,
          message: e,
        })
      );
    }
  },
  closeJob: async (req, res, next) => {
    const errTitle = "Error when closing job.";

    try {
      const job = await JobsModel.findByIdAndUpdate(
        req.query.jobID,
        {
          closed: true,
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send(job);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          type: errTitle,
          message: e,
        })
      );
    }
  },
  reopenJob: async (req, res, next) => {
    const errTitle = "Error when reopening job.";

    try {
      const job = await JobsModel.findByIdAndUpdate(
        req.query.jobID,
        {
          closed: false,
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send(job);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          type: errTitle,
          message: e,
        })
      );
    }
  },
  uploadCoverPic: async (req, res, next) => {
    const errTitle = "Error when uploading cover picture.";

    try {
      const job = await JobsModel.findByIdAndUpdate(
        req.query.jobID,
        {
          project_cover_picture: req.file,
        },
        {
          new: true,
        }
      );

      return res.status(httpStatus.OK).send(job);
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
