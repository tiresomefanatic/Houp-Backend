const {
  ProfilesModel,
  JobsModel,
  ProjectsModel,
  MediaModel,
  ConversationsModel,
} = require("./../models");
const httpStatus = require("../utils/http_status_codes");
const createHttpError = require("http-errors");
const { isObjectIdValid, getValues } = require("../utils/common_utils");
const { conversationTypes } = require("../constants");

const checkProfileAccess = async (profile_id, req, next) => {
  const errTitle = "Error when checking profile access.";

  if (!profile_id) {
    return next(
      createHttpError(httpStatus.UNAUTHORIZED, {
        title: errTitle,
        message: "Profile ID is required.",
      })
    );
  } else if (!isObjectIdValid(profile_id)) {
    return next(
      createHttpError(httpStatus.BAD_REQUEST, {
        title: errTitle,
        message: "Profile ID is not a valid Object ID.",
      })
    );
  }

  try {
    const profile = await ProfilesModel.findById(profile_id);
    if (profile) {
      if (profile._id.toString() === req.profile.profile_id.toString()) {
        return next();
      } else {
        return next(
          createHttpError(httpStatus.FORBIDDEN, {
            title: errTitle,
            message: "Permission denied to access this resource.",
          })
        );
      }
    } else {
      return next(
        createHttpError(httpStatus.NOT_FOUND, {
          title: errTitle,
          message: "Profile not found.",
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
};
const checkProjectAccess = async (profile_id, project_id, req, next) => {
  const errTitle = "Error when checking project access.";

  if (!profile_id) {
    return next(
      createHttpError(httpStatus.UNAUTHORIZED, {
        title: errTitle,
        message: "Profile ID is required.",
      })
    );
  } else if (!isObjectIdValid(profile_id)) {
    return next(
      createHttpError(httpStatus.BAD_REQUEST, {
        title: errTitle,
        message: "Profile ID is not a valid Object ID.",
      })
    );
  }
  if (!project_id) {
    return next(
      createHttpError(httpStatus.UNAUTHORIZED, {
        title: errTitle,
        message: "Project ID is required.",
      })
    );
  } else if (!isObjectIdValid(project_id)) {
    return next(
      createHttpError(httpStatus.BAD_REQUEST, {
        title: errTitle,
        message: "Project ID is not a valid Object ID.",
      })
    );
  }

  try {
    const project = await ProjectsModel.findOne({
      _id: project_id,
      $or: [
        {
          profile: profile_id,
        },
        {
          project_admins: profile_id,
        },
      ],
    });
    if (project) {
      if (
        project.profile.toString() === req.profile.profile_id.toString() ||
        project.project_admins.includes(req.profile.profile_id.toString())
      ) {
        return next();
      } else {
        return next(
          createHttpError(httpStatus.FORBIDDEN, {
            title: errTitle,
            message: "Permission denied to access this resource.",
          })
        );
      }
    } else {
      return next(
        createHttpError(httpStatus.NOT_FOUND, {
          title: errTitle,
          message: "Project not found.",
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
};
const checkJobAccess = async (profile_id, job_id, req, next) => {
  const errTitle = "Error when checking job access.";

  if (!profile_id) {
    return next(
      createHttpError(httpStatus.UNAUTHORIZED, {
        title: errTitle,
        message: "Profile ID is required.",
      })
    );
  } else if (!isObjectIdValid(profile_id)) {
    return next(
      createHttpError(httpStatus.BAD_REQUEST, {
        title: errTitle,
        message: "Profile ID is not a valid Object ID.",
      })
    );
  }
  if (!job_id) {
    return next(
      createHttpError(httpStatus.UNAUTHORIZED, {
        title: errTitle,
        message: "Job ID is required.",
      })
    );
  } else if (!isObjectIdValid(job_id)) {
    return next(
      createHttpError(httpStatus.BAD_REQUEST, {
        title: errTitle,
        message: "Job ID is not a valid Object ID.",
      })
    );
  }

  try {
    const job = await JobsModel.findById(job_id);
    if (job) {
      if (job.project) {
        checkProjectAccess(profile_id, job.project, req, (error) => {
          if (error) {
            return next(error);
          } else {
            return next();
          }
        });
      } else {
        if (job.profile.toString() === req.profile.profile_id.toString()) {
          return next();
        } else {
          return next(
            createHttpError(httpStatus.FORBIDDEN, {
              title: errTitle,
              message: "Permission denied to access this resource.",
            })
          );
        }
      }
    } else {
      return next(
        createHttpError(httpStatus.NOT_FOUND, {
          title: errTitle,
          message: "Job not found.",
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
};
const checkMediaAccess = async (profile_id, media_id, req, next) => {
  const errTitle = "Error when checking media access.";

  if (!profile_id) {
    return next(
      createHttpError(httpStatus.UNAUTHORIZED, {
        title: errTitle,
        message: "Profile ID is required.",
      })
    );
  } else if (!isObjectIdValid(profile_id)) {
    return next(
      createHttpError(httpStatus.BAD_REQUEST, {
        title: errTitle,
        message: "Profile ID is not a valid Object ID.",
      })
    );
  }
  if (!media_id) {
    return next(
      createHttpError(httpStatus.UNAUTHORIZED, {
        title: errTitle,
        message: "Media ID is required.",
      })
    );
  } else if (!isObjectIdValid(media_id)) {
    return next(
      createHttpError(httpStatus.BAD_REQUEST, {
        title: errTitle,
        message: "Media ID is not a valid Object ID.",
      })
    );
  }

  try {
    const media = await MediaModel.findById(media_id);
    if (media) {
      if (media.project) {
        checkProjectAccess(profile_id, media.project, req, (error) => {
          if (error) {
            return next(error);
          } else {
            return next();
          }
        });
      } else {
        if (media.profile.toString() === req.profile.profile_id.toString()) {
          return next();
        } else {
          return next(
            createHttpError(httpStatus.FORBIDDEN, {
              title: errTitle,
              message: "Permission denied to access this resource.",
            })
          );
        }
      }
    } else {
      return next(
        createHttpError(httpStatus.NOT_FOUND, {
          title: errTitle,
          message: "Media not found.",
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
};
const checkConvoAccess = async (profile_id, convo_id, type, req, next) => {
  const errTitle = "Error when checking conversation access.";

  if (!profile_id) {
    return next(
      createHttpError(httpStatus.UNAUTHORIZED, {
        title: errTitle,
        message: "Profile ID is required.",
      })
    );
  } else if (!isObjectIdValid(profile_id)) {
    return next(
      createHttpError(httpStatus.BAD_REQUEST, {
        title: errTitle,
        message: "Profile ID is not a valid Object ID.",
      })
    );
  }
  if (!convo_id) {
    return next(
      createHttpError(httpStatus.UNAUTHORIZED, {
        title: errTitle,
        message: "Conversation ID is required.",
      })
    );
  } else if (!isObjectIdValid(convo_id)) {
    return next(
      createHttpError(httpStatus.BAD_REQUEST, {
        title: errTitle,
        message: "Conversation ID is not a valid Object ID.",
      })
    );
  }
  if (!getValues(conversationTypes).includes(type)) {
    return next(
      createHttpError(httpStatus.BAD_REQUEST, {
        title: errTitle,
        message: "Conversation type is required in query.",
      })
    );
  }

  try {
    const convo = await ConversationsModel.findOne({
      _id: convo_id,
      type,
      profiles: profile_id,
    });
    if (convo) {
      if (convo.profiles.includes(req.profile.profile_id.toString())) {
        return next();
      } else {
        return next(
          createHttpError(httpStatus.FORBIDDEN, {
            title: errTitle,
            message: "Permission denied to access this resource.",
          })
        );
      }
    } else {
      return next(
        createHttpError(httpStatus.NOT_FOUND, {
          title: errTitle,
          message: "Conversation not found.",
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
};

module.exports = (accessId = 0) => {
  const errTitle = "Error when checking access.";
  const errProfileTitle = "Error when checking profile access.";
  const errJobTitle = "Error when checking job access.";

  return (req, res, next) => {
    switch (accessId) {
      case 1: {
        // Checks if it's the actual profile logged in from params
        checkProfileAccess(req.params.id, req, next);
        break;
      }
      case 2: {
        // Checks if it's the actual profile logged in from body
        checkProfileAccess(req.body.profile_id, req, next);
        break;
      }
      case 3: {
        // Checks if it's the actual profile logged in from body or params
        if (
          req.body.profile_id &&
          req.params.id &&
          req.body.profile_id !== req.params.id
        ) {
          return next(
            createHttpError(httpStatus.CONFLICT, {
              title: errProfileTitle,
              message: "Two different profile IDs provided.",
            })
          );
        }

        checkProfileAccess(req.body.profile_id || req.params.id, req, next);
        break;
      }
      case 4: {
        // Checks if profile owns the job from params
        checkJobAccess(req.params.id, req.query.jobID, req, next);
        break;
      }
      case 5: {
        // Checks if profile owns the job from body
        checkJobAccess(req.body.profile_id, req.body.job_id, req, next);
        break;
      }
      case 6: {
        // Checks if profile owns the job from body or params
        if (
          req.body.profile_id &&
          req.params.id &&
          req.body.profile_id !== req.params.id
        ) {
          return next(
            createHttpError(httpStatus.CONFLICT, {
              title: errProfileTitle,
              message: "Two different profile IDs provided.",
            })
          );
        }
        if (
          req.body.job_id &&
          req.query.jobID &&
          req.body.job_id !== req.query.jobID
        ) {
          return next(
            createHttpError(httpStatus.CONFLICT, {
              title: errJobTitle,
              message: "Two different job IDs provided.",
            })
          );
        }

        checkJobAccess(
          req.body.profile_id || req.params.id,
          req.body.job_id || req.query.jobID,
          req,
          next
        );
        break;
      }
      case 7: {
        // Checks if profile owns the project or is admin from params
        checkProjectAccess(req.params.id, req.query.projectID, req, next);
        break;
      }
      case 8: {
        // Checks if profile owns the project or is admin from body
        checkProjectAccess(req.body.profile_id, req.body.project_id, req, next);
        break;
      }
      case 9: {
        // Checks if profile owns the project or is admin from body or params
        if (
          req.body.profile_id &&
          req.params.id &&
          req.body.profile_id !== req.params.id
        ) {
          return next(
            createHttpError(httpStatus.CONFLICT, {
              title: errProfileTitle,
              message: "Two different profile IDs provided.",
            })
          );
        }
        if (
          req.body.project_id &&
          req.query.projectID &&
          req.body.project_id !== req.query.projectID
        ) {
          return next(
            createHttpError(httpStatus.CONFLICT, {
              title: errJobTitle,
              message: "Two different job IDs provided.",
            })
          );
        }

        checkProjectAccess(
          req.body.profile_id || req.params.id,
          req.body.project_id || req.query.projectID,
          req,
          next
        );
        break;
      }
      case 10: {
        // Checks if profile owns the media from params
        checkMediaAccess(req.params.id, req.query.mediaID, req, next);
        break;
      }
      case 11: {
        // Checks if profile owns the media from body
        checkMediaAccess(req.body.profile_id, req.body.media_id, req, next);
        break;
      }
      case 12: {
        // Checks if profile owns the media from body or params
        if (
          req.body.profile_id &&
          req.params.id &&
          req.body.profile_id !== req.params.id
        ) {
          return next(
            createHttpError(httpStatus.CONFLICT, {
              title: errProfileTitle,
              message: "Two different profile IDs provided.",
            })
          );
        }
        if (
          req.body.media_id &&
          req.query.mediaID &&
          req.body.media_id !== req.query.mediaID
        ) {
          return next(
            createHttpError(httpStatus.CONFLICT, {
              title: errJobTitle,
              message: "Two different media IDs provided.",
            })
          );
        }

        checkMediaAccess(
          req.body.profile_id || req.params.id,
          req.body.media_id || req.query.mediaID,
          req,
          next
        );
        break;
      }
      case 13: {
        // Checks if profile is in conversation from params
        checkConvoAccess(
          req.params.id,
          req.query.convoID,
          req.query.type,
          req,
          next
        );
        break;
      }
      case 14: {
        // Checks if profile is in conversation from body
        checkConvoAccess(
          req.body.profile_id,
          req.body.convo_id,
          req.body.type,
          req,
          next
        );
        break;
      }
      case 15: {
        // Checks if profile is in conversation from body or params
        if (
          req.body.profile_id &&
          req.params.id &&
          req.body.profile_id !== req.params.id
        ) {
          return next(
            createHttpError(httpStatus.CONFLICT, {
              title: errProfileTitle,
              message: "Two different profile IDs provided.",
            })
          );
        }
        if (
          req.body.convo_id &&
          req.query.convoID &&
          req.body.convo_id !== req.query.convoID
        ) {
          return next(
            createHttpError(httpStatus.CONFLICT, {
              title: errJobTitle,
              message: "Two different conversation IDs provided.",
            })
          );
        }
        if (
          req.body.type &&
          req.query.type &&
          req.body.type !== req.query.type
        ) {
          return next(
            createHttpError(httpStatus.CONFLICT, {
              title: errJobTitle,
              message: "Two different conversation types provided.",
            })
          );
        }

        checkConvoAccess(
          req.body.profile_id || req.params.id,
          req.body.convo_id || req.query.convoID,
          req.body.type || req.query.type,
          req,
          next
        );
        break;
      }
      default: {
        return next(
          createHttpError(httpStatus.FORBIDDEN, {
            title: errTitle,
            message: "Permission not allowed / not exists...",
          })
        );
      }
    }
  };
};
