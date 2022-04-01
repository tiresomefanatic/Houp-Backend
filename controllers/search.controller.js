const Joi = require("@hapi/joi");
const createHttpError = require("http-errors");
const httpStatus = require("../utils/http_status_codes");
const {
  ProfilesModel,
  ProjectsModel,
  JobsModel,
  CastRolesModel,
  CrewRolesModel,
} = require("../models");
const { getValues } = require("../utils/common_utils");
const { professions, deptSections } = require("../constants");

const publicRestrictedFields = {
  roles: 0,
  conversations: 0,
  blocked_profiles: 0,
  jobs_applied: 0,
  password: 0,
};

module.exports = {
  search: async (req, res, next) => {
    const errTitle = "Error when searching.";

    const reqSchema = Joi.object({
      string: Joi.string().required().allow(""),
      indices: Joi.array().items(Joi.string()).min(1).required(),
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
      const { string, indices } = req.body;

      const documents = {};
      if (indices.includes("profiles")) {
        const profiles = await ProfilesModel.find({
          $or: [
            {
              name: { $regex: string, $options: "i" },
            },
            {
              professions: { $regex: string, $options: "i" },
            },
            {
              bio: { $regex: string, $options: "i" },
            },
          ],
        })
          .populate({
            path: "media",
            select: "stars",
          })
          .select(publicRestrictedFields);
        documents.profiles = profiles;
      } else if (indices.includes("projects")) {
        const projects = await ProjectsModel.find({
          $or: [
            {
              project_title: { $regex: string, $options: "i" },
            },
            {
              project_description: { $regex: string, $options: "i" },
            },
          ],
        });
        document.projects = projects;
      } else if (indices.includes("jobs")) {
        const jobs = await JobsModel.find({
          $or: [
            {
              project_title: { $regex: string, $options: "i" },
            },
            {
              project_description: { $regex: string, $options: "i" },
            },
          ],
          cast_roles: {
            $exists: true,
          },
          crew_roles: {
            $exists: true,
          },
          closed: false,
        });
        document.jobs = jobs;
      }

      return res.status(httpStatus.OK).send(documents);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  searchProfiles: async (req, res, next) => {
    const errTitle = "Error when searching profiles.";

    const reqSchema = Joi.object({
      professions: Joi.array()
        .items(Joi.string().valid(...getValues(professions, "role")))
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
      const { professions } = req.body;

      const profiles = await ProfilesModel.find({
        professions: { $in: professions },
      })
        .populate({
          path: "media",
          select: "stars",
        })
        .select(publicRestrictedFields);

      return res.status(httpStatus.OK).send(profiles);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  searchProjects: async (req, res, next) => {
    const errTitle = "Error when searching projects.";

    try {
      const projects = await ProjectsModel.find();

      return res.status(httpStatus.OK).send(projects);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  searchJobs: async (req, res, next) => {
    const errTitle = "Error when searching jobs.";

    const reqSchema = Joi.object({
      role: Joi.string()
        .valid(...getValues(professions, "role"))
        .required()
        .allow(""),
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
      const { role } = req.body;
      let jobs = [];

      if (role) {
        const isCast =
          getValues(professions, "section", { role })[0] === deptSections.CAST;
        const isCrew =
          getValues(professions, "section", { role })[0] === deptSections.CREW;

        const jobIDs = [];
        if (isCast) {
          const castRoles = await CastRolesModel.find({ role });
          jobIDs.push(...castRoles.map((role) => role.job));
        } else if (isCrew) {
          const crewRoles = await CrewRolesModel.find({ role });
          jobIDs.push(...crewRoles.map((role) => role.job));
        }

        jobs = await JobsModel.find({ _id: jobIDs, closed: false }).populate(
          "cast_roles crew_roles"
        );
      } else {
        jobs = await JobsModel.find({ closed: false }).populate(
          "cast_roles crew_roles"
        );
      }

      return res.status(httpStatus.OK).send(jobs);
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
