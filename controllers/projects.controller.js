const crypto = require("crypto");
const Joi = require("@hapi/joi");
const createHttpError = require("http-errors");
const httpStatus = require("../utils/http_status_codes");
const {
  ProjectsModel,
  ProfilesModel,
  ProjectInvitesModel,
} = require("../models");
const {
  projectTypes,
  professions,
  notificationTypes,
} = require("../constants");
const {
  isObjectIdValid,
  getValues,
  formatString,
} = require("../utils/common_utils");
const NotificationsController = require("./notifications.controller");
const { AuthGuard } = require("../middlewares");

const checkIfProjectMember = async (profiles, project) => {
  await profiles.forEach(async (profile) => {
    const projectExists = await ProjectsModel.findOne({
      _id: project._id,
      $or: [
        {
          profile: profile,
        },
        {
          project_admins: profile,
        },
        {
          "project_team.profile": profile,
          "project_team.accepted": true,
        },
      ],
    });

    if (!projectExists) {
      await ProfilesModel.findByIdAndUpdate(
        profile,
        {
          $pull: {
            projects: project._id,
          },
        },
        { new: true }
      );
    }
  });
};

module.exports = {
  getAllProjects: async (req, res, next) => {
    const errTitle = "Error when getting all projects.";

    try {
      const projects = await ProjectsModel.find();

      if (projects) {
        return res.status(httpStatus.OK).send(projects);
      } else {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Projects Not Found.",
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
  getProfileProjects: async (req, res, next) => {
    const errTitle = "Error when getting all profile projects.";

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
      const profile = await ProfilesModel.findById(req.params.id).populate(
        "projects"
      );

      if (profile) {
        return res.status(httpStatus.OK).send(profile.projects);
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
  getProfileAdminProjects: async (req, res, next) => {
    const errTitle = "Error when getting all profile admin projects.";

    try {
      const projects = await ProjectsModel.find({
        $or: [
          {
            profile: req.params.id,
          },
          {
            project_admins: req.params.id,
          },
        ],
      });

      if (projects) {
        return res.status(httpStatus.OK).send(projects);
      } else {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Projects Not Found.",
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
  getProject: async (req, res, next) => {
    const errTitle = "Error when getting project.";

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
      AuthGuard(req, res, async () => {
        let project;
        if (req.profile && req.profile.profile_id) {
          project = await ProjectsModel.findByIdAndUpdate(
            req.params.project_id,
            { $addToSet: { project_views: req.profile.profile_id } },
            { new: true }
          )
            .populate({ path: "project_media", select: "cover_picture stars" })
            .populate({
              path: "profile",
              select: "profile_picture name professions",
            })
            .populate({
              path: "project_admins",
              select: "profile_picture name professions",
            })
            .populate({
              path: "project_team.profile",
              select: "profile_picture name professions",
            })
            .populate({
              path: "project_jobs",
              select: "-applications",
              populate: [
                {
                  path: "cast_roles",
                  select: "role",
                },
                {
                  path: "crew_roles",
                  select: "role",
                },
                {
                  path: "profile",
                  select: "profile_picture name professions",
                },
              ],
            });
        } else {
          project = await ProjectsModel.findById(req.params.project_id)
            .populate({ path: "project_media", select: "cover_picture stars" })
            .populate({
              path: "profile",
              select: "profile_picture name professions",
            })
            .populate({
              path: "project_admins",
              select: "profile_picture name professions",
            })
            .populate({
              path: "project_team.profile",
              select: "profile_picture name professions",
            })
            .populate({
              path: "project_jobs",
              select: "-applications",
              populate: [
                {
                  path: "cast_roles",
                  select: "role",
                },
                {
                  path: "crew_roles",
                  select: "role",
                },
                {
                  path: "profile",
                  select: "profile_picture name professions",
                },
              ],
            });
        }

        if (project) {
          let totalStars = 0;
          (project.project_media ?? []).forEach((media) => {
            totalStars += media.stars.length;
          });
          project.set("total_stars", totalStars, { strict: false });

          return res.status(httpStatus.OK).send(project);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Project Not Found.",
            })
          );
        }
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
  addProject: async (req, res, next) => {
    const errTitle = "Error when adding project.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      project_admins: Joi.array().items(
        Joi.string().custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Profile ID is not a valid Object ID.");
          }
          return value;
        })
      ),
      project_title: Joi.string().required(),
      project_description: Joi.string().required(),
      project_type: Joi.string()
        .valid(...getValues(projectTypes))
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
      const newProject = { ...req.body };
      newProject.profile = req.body.profile_id;
      delete newProject.profile_id;
      newProject.project_cover_picture = req.file;

      if (newProject.project_admins) {
        const profile = await ProfilesModel.findById(req.body.profile_id);
        let notConnected;
        const checkConnections = newProject.project_admins.every((admin) => {
          if (!profile.connections.includes(admin)) {
            notConnected = admin;
            return false;
          }
          return true;
        });
        if (!checkConnections) {
          return next(
            createHttpError(httpStatus.BAD_REQUEST, {
              title: errTitle,
              message: `${notConnected} is not a connection.`,
            })
          );
        }
      }

      const project = await new ProjectsModel(newProject).save();

      await ProfilesModel.updateMany(
        {
          _id: [project.profile, ...project.project_admins],
        },
        {
          $push: {
            projects: project._id,
          },
        },
        { new: true }
      );

      // Send Notification to all project admins
      const notif_profiles = project.project_admins;
      const profile_from = project.profile.toString();
      const project_id = project._id.toString();
      const notification = {
        profiles: notif_profiles.map((id) => id.toString()),
        type: notificationTypes.PROJECT_ADMIN,
        message: `@{profile:${profile_from}} made you admin for the project @{project:${project_id}}`,
        action: `/project/${project_id}`,
        mentioned_profiles: [profile_from].map((id) => id.toString()),
        mentioned_projects: [project_id].map((id) => id.toString()),
      };

      await NotificationsController.pushNotification(notification);

      return res.status(httpStatus.OK).send(project);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  updateProject: async (req, res, next) => {
    const errTitle = "Error when updating project.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      project_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Project ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
      project_title: Joi.string().required(),
      project_description: Joi.string().required(),
      project_type: Joi.string()
        .valid(...getValues(projectTypes))
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
      const newProject = { ...req.body };
      delete newProject.profile_id;
      delete newProject.project_id;
      newProject.project_cover_picture = req.file;

      const project = await ProjectsModel.findByIdAndUpdate(
        req.body.project_id,
        newProject,
        { new: true }
      );

      // Send Notification to project owner, all project admins, all project members and all project followers
      const project_members = project.project_team
        .filter((member) => member.accepted)
        .map((member) => member.profile);
      const notif_profiles = [
        project.profile,
        ...project.project_admins,
        ...project_members,
        ...project.project_followers,
      ];
      const profile_from = req.body.profile_id;
      const project_id = project._id;
      const notification = {
        profiles: notif_profiles.map((id) => id.toString()),
        type: notificationTypes.PROJECT_UPDATE,
        message: `Project @{project:${project_id}} has been updated`,
        action: `/project/${project_id}`,
        mentioned_profiles: [profile_from].map((id) => id.toString()),
        mentioned_projects: [project_id].map((id) => id.toString()),
      };

      await NotificationsController.pushNotification(notification);

      return res.status(httpStatus.OK).send(project);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  removeProject: async (req, res, next) => {
    const errTitle = "Error when removing project.";

    if (!req.query.projectID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Project ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.projectID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Project ID is not a valid Object ID.",
        })
      );
    }

    try {
      const project = await ProjectsModel.findOneAndDelete({
        _id: req.query.projectID,
        profile: req.params.id,
      });

      if (!project) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Project Not Found.",
          })
        );
      }

      await ProfilesModel.updateMany(
        {
          _id: [
            project.profile,
            ...project.project_admins,
            ...project.project_team.map((mem) => mem.profile),
          ],
        },
        {
          $pull: {
            projects: project._id,
          },
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send(project);
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

    try {
      const project = await ProjectsModel.findByIdAndUpdate(
        req.query.projectID,
        {
          project_cover_picture: req.file,
        },
        {
          new: true,
        }
      );

      return res.status(httpStatus.OK).send(project);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  updateAdmins: async (req, res, next) => {
    const errTitle = "Error when updating project admins.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      project_id: Joi.string().required(),
      project_admins: Joi.array()
        .items(
          Joi.string().custom((value, helper) => {
            if (!isObjectIdValid(value)) {
              return helper.error("Profile ID is not a valid Object ID.");
            }
            return value;
          })
        )
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
      const oldProject = await ProjectsModel.findById(req.body.project_id);

      const adminsRemoved = oldProject.project_admins
        .map((admin) => admin.toString())
        .filter(
          (admin) =>
            !req.body.project_admins
              .map((admin) => admin.toString())
              .includes(admin)
        );
      const adminsAdded = req.body.project_admins
        .map((admin) => admin.toString())
        .filter(
          (admin) =>
            !oldProject.project_admins
              .map((admin) => admin.toString())
              .includes(admin)
        );

      if (adminsAdded.length > 0) {
        const profile = await ProfilesModel.findById(req.body.profile_id);
        let notConnected;
        const checkConnections = adminsAdded.every((admin) => {
          if (!profile.connections.includes(admin)) {
            notConnected = admin;
            return false;
          }
          return true;
        });
        if (!checkConnections) {
          return next(
            createHttpError(httpStatus.BAD_REQUEST, {
              title: errTitle,
              message: `${notConnected} is not a connection.`,
            })
          );
        }
      }

      let project;

      if (adminsRemoved.length > 0) {
        project = await ProjectsModel.findByIdAndUpdate(
          req.body.project_id,
          {
            $pull: {
              project_admins: {
                $in: adminsRemoved,
              },
            },
          },
          { new: true }
        );

        await checkIfProjectMember(adminsRemoved, project);
      }
      if (adminsAdded.length > 0) {
        project = await ProjectsModel.findByIdAndUpdate(
          req.body.project_id,
          {
            $push: {
              project_admins: {
                $each: adminsAdded,
              },
            },
          },
          { new: true }
        );

        await ProfilesModel.updateMany(
          {
            _id: adminsAdded,
          },
          {
            $addToSet: {
              projects: project._id,
            },
          },
          { new: true }
        );

        // Send Notification to all new project admins
        const notif_profiles = adminsAdded;
        const profile_from = req.body.profile_id;
        const project_id = req.body.project_id;
        const notification = {
          profiles: notif_profiles.map((id) => id.toString()),
          type: notificationTypes.PROJECT_ADMIN,
          message: `@{profile:${profile_from}} made you admin for the project @{project:${project_id}}`,
          action: `/project/${project_id}`,
          mentioned_profiles: [profile_from].map((id) => id.toString()),
          mentioned_projects: [project_id].map((id) => id.toString()),
        };

        await NotificationsController.pushNotification(notification);
      }

      if (!project) {
        return next(
          createHttpError(httpStatus.BAD_REQUEST, {
            title: errTitle,
            message: "Admins already the same.",
          })
        );
      }

      return res.status(httpStatus.OK).send(project);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  updateTeam: async (req, res, next) => {
    const errTitle = "Error when updating project team.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      project_id: Joi.string().required(),
      project_team: Joi.array()
        .items(
          Joi.object({
            role: Joi.string()
              .valid(...getValues(professions, "role"))
              .required(),
            profile: Joi.string()
              .custom((value, helper) => {
                if (!isObjectIdValid(value)) {
                  return helper.error("Profile ID is not a valid Object ID.");
                }
                return value;
              })
              .required(),
          })
        )
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
      const oldProject = await ProjectsModel.findById(req.body.project_id);

      const teamAdded = req.body.project_team.filter((member) => {
        return !oldProject.project_team.find((mem) => {
          return (
            mem.profile.toString() === member.profile.toString() &&
            mem.role === member.role
          );
        });
      });
      const teamRemoved = oldProject.project_team.filter((member) => {
        return !req.body.project_team.find((mem) => {
          return (
            mem.profile.toString() === member.profile.toString() &&
            mem.role === member.role
          );
        });
      });

      if (teamAdded.length > 0) {
        const profile = await ProfilesModel.findById(req.body.profile_id);
        let notConnected;
        const checkConnections = teamAdded.every((member) => {
          if (!profile.connections.includes(member.profile)) {
            notConnected = member.profile;
            return false;
          }
          return true;
        });
        if (!checkConnections) {
          return next(
            createHttpError(httpStatus.BAD_REQUEST, {
              title: errTitle,
              message: `${notConnected} is not a connection.`,
            })
          );
        }
      }

      let project;

      if (teamRemoved.length > 0) {
        project = await ProjectsModel.findByIdAndUpdate(
          req.body.project_id,
          {
            $pull: {
              project_team: {
                $in: teamRemoved,
              },
            },
          },
          { new: true }
        );

        await checkIfProjectMember(
          teamRemoved.map((mem) => mem.profile),
          project
        );
      }
      if (teamAdded.length > 0) {
        project = await ProjectsModel.findByIdAndUpdate(
          req.body.project_id,
          {
            $addToSet: {
              project_team: {
                $each: teamAdded,
              },
            },
          },
          { new: true }
        );

        // Send Notification to all new project roles
        const profile_from = req.body.profile_id;
        const project_id = req.body.project_id;
        await teamAdded.forEach(async (member) => {
          const { profile, role } = member;
          const notification = {
            profiles: [profile].map((id) => id.toString()),
            type: notificationTypes.PROJECT_INVITE,
            message: `@{profile:${profile_from}} has invited you to the project @{project:${project_id}} for the role of ${formatString(
              role
            )}`,
            action: `/project/${project_id}`,
            mentioned_profiles: [profile_from].map((id) => id.toString()),
            mentioned_projects: [project_id].map((id) => id.toString()),
          };

          await NotificationsController.pushNotification(notification);
        });
      }

      if (!project) {
        return next(
          createHttpError(httpStatus.BAD_REQUEST, {
            title: errTitle,
            message: "Team is already the same.",
          })
        );
      }

      return res.status(httpStatus.OK).send(project);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  getInvitesToProjects: async (req, res, next) => {
    try {
      const projects = await ProjectsModel.find({
        "project_team.profile": req.params.id,
        "project_team.accepted": false,
      }).select({
        project_team: 1,
        project_cover_picture: 1,
        project_title: 1,
      });

      const invites = projects.map((project) => ({
        project: {
          _id: project._id,
          project_cover_picture: project.project_cover_picture,
          project_title: project.project_title,
        },
        invites: project.project_team.filter(
          (member) =>
            member.profile.toString() === req.params.id && !member.accepted
        ),
      }));

      return res.status(httpStatus.OK).send(invites);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  shareProjectInvite: async (req, res, next) => {
    const errTitle = "Error when sharing project invite.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      project_id: Joi.string().required(),
      role: Joi.string()
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
      const token = crypto.randomBytes(40).toString("hex");

      const invite = await new ProjectInvitesModel({
        project: req.body.project_id,
        role: req.body.role,
        token,
        invited_by: req.body.profile_id,
      }).save();

      return res.status(httpStatus.OK).send(invite);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  acceptProjectInvite: async (req, res, next) => {
    const errTitle = "Error when accepting project invite.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      project_id: Joi.string().required(),
      token: Joi.string().required(),
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
      const invite = await ProjectInvitesModel.findOne({
        project: req.body.project_id,
        token: req.body.token,
      });

      if (!invite) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Invite Not Found.",
          })
        );
      }

      const project = await ProjectsModel.findById(req.body.project_id);
      const alreadyInvited = project.project_team.find(
        (mem) =>
          mem.profile === req.body.profile_id && mem.role === req.body.role
      );
      if (alreadyInvited) {
        return next(
          createHttpError(httpStatus.CONFLICT, {
            title: errTitle,
            message: "Already invited to the same role.",
          })
        );
      }

      await ProjectInvitesModel.findByIdAndDelete(invite._id);

      await ProjectsModel.findByIdAndUpdate(
        project._id,
        {
          $addToSet: {
            project_team: {
              profile: req.body.profile_id,
              role: invite.role,
            },
          },
        },
        { new: true }
      );

      // Send Notification
      const { invited_by: profile_from, project: project_id, role } = invite;
      const profile = req.body.profile_id;
      const notification = {
        profiles: [profile].map((id) => id.toString()),
        type: notificationTypes.PROJECT_INVITE,
        message: `@{profile:${profile_from}} has invited you to the project @{project:${project_id}} for the role of ${formatString(
          role
        )}`,
        action: `/project/${project_id}`,
        mentioned_profiles: [profile_from].map((id) => id.toString()),
        mentioned_projects: [project_id].map((id) => id.toString()),
      };

      await NotificationsController.pushNotification(notification);

      return res.status(httpStatus.OK).send(project);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  resolveInviteToProject: async (req, res, next) => {
    const errTitle = "Error when resolving project invite.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().required(),
      project_id: Joi.string()
        .custom((value, helper) => {
          if (!isObjectIdValid(value)) {
            return helper.error("Project ID is not a valid Object ID.");
          }
          return value;
        })
        .required(),
      role: Joi.string()
        .valid(...getValues(professions, "role"))
        .required(),
      accepted: Joi.boolean().strict().required(),
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
      const project = await ProjectsModel.findOne({
        _id: req.body.project_id,
        "project_team.profile": req.body.profile_id,
        "project_team.role": req.body.role,
        "project_team.accepted": false,
      });

      if (!project) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Invitation Not Found.",
          })
        );
      }

      let newProject;
      if (req.body.accepted) {
        newProject = await ProjectsModel.updateOne(
          {
            _id: req.body.project_id,
            "project_team.profile": req.body.profile_id,
            "project_team.role": req.body.role,
          },
          {
            $set: {
              "project_team.$.accepted": true,
            },
          },
          { new: true }
        );

        await ProfilesModel.findByIdAndUpdate(
          req.body.profile_id,
          {
            $addToSet: {
              projects: req.body.project_id,
            },
          },
          { new: true }
        );
      } else {
        newProject = await ProjectsModel.findByIdAndUpdate(
          req.body.project_id,
          {
            $pull: {
              project_team: {
                profile: req.body.profile_id,
                role: req.body.role,
              },
            },
          },
          { new: true }
        );
      }

      return res.status(httpStatus.OK).send(newProject);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  leaveProject: async (req, res, next) => {
    const errTitle = "Error when leaving project.";

    if (!req.query.projectID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Project ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.projectID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Project ID is not a valid Object ID.",
        })
      );
    }

    try {
      const profile = await ProfilesModel.findOne({
        _id: req.params.id,
        projects: req.query.projectID,
      });

      if (!profile) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Already not a member of the project.",
          })
        );
      }

      const project = await ProjectsModel.findOne({
        _id: req.query.projectID,
        profile: req.params.id,
      });

      if (project) {
        return next(
          createHttpError(httpStatus.CONFLICT, {
            title: errTitle,
            message: "Project owner can't leave the project.",
          })
        );
      }

      await ProjectsModel.findByIdAndUpdate(
        req.query.projectID,
        {
          $pull: {
            project_admins: req.params.id,
            project_team: {
              profile: req.params.id,
            },
          },
        },
        { new: true }
      );

      await ProfilesModel.findByIdAndUpdate(
        req.params.id,
        {
          $pull: {
            projects: req.query.projectID,
          },
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send({
        message: "Successfully left the project.",
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
  getProjectFollowers: async (req, res, next) => {
    const errTitle = "Error when getting project followers.";

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
      const project = await ProjectsModel.findById(req.params.project_id)
        .select("project_title project_cover_picture project_followers")
        .populate({
          path: "project_followers",
          select: "profile_picture name professions",
        });

      if (!project) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Project Not Found.",
          })
        );
      }

      return res.status(httpStatus.OK).send(project);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  followProject: async (req, res, next) => {
    const errTitle = "Error when following project.";

    if (!req.query.projectID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Project ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.projectID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Project ID is not a valid Object ID.",
        })
      );
    }

    try {
      const project = await ProjectsModel.findByIdAndUpdate(
        req.query.projectID,
        {
          $addToSet: {
            project_followers: req.params.id,
          },
        },
        { new: true }
      );

      if (!project) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Project Not Found.",
          })
        );
      }

      // Send Notification to project owner, all project admins and all project members
      const project_members = project.project_team
        .filter((member) => member.accepted)
        .map((member) => member.profile);
      const notif_profiles = [
        project.profile,
        ...project.project_admins,
        ...project_members,
      ];
      const profile_from = req.params.id;
      const project_id = project._id;
      const notification = {
        profiles: notif_profiles.map((id) => id.toString()),
        type: notificationTypes.PROJECT_FOLLOW,
        message: `@{profile:${profile_from}} is now following your project @{project:${project_id}}`,
        action: `/project/${project_id}`,
        mentioned_profiles: [profile_from].map((id) => id.toString()),
        mentioned_projects: [project_id].map((id) => id.toString()),
      };

      await NotificationsController.pushNotification(notification);

      return res.status(httpStatus.OK).send(project);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  unFollowProject: async (req, res, next) => {
    const errTitle = "Error when un-following project.";

    if (!req.query.projectID) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Project ID is required in params.",
        })
      );
    } else if (!isObjectIdValid(req.query.projectID)) {
      return next(
        createHttpError(httpStatus.BAD_REQUEST, {
          title: errTitle,
          message: "Project ID is not a valid Object ID.",
        })
      );
    }

    try {
      const project = await ProjectsModel.findByIdAndUpdate(
        req.query.projectID,
        {
          $pull: {
            project_followers: req.params.id,
          },
        },
        { new: true }
      );

      if (!project) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Project Not Found.",
          })
        );
      }

      return res.status(httpStatus.OK).send(project);
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
