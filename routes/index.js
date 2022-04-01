const createHttpError = require("http-errors");
const { AuthGuard } = require("../middlewares");
const httpStatus = require("../utils/http_status_codes");
const { getValues } = require("../utils/common_utils");

module.exports.init = (app) => {
  app.use("", require("./auth.route")); // * Authentication

  app.use("/profiles", require("./profiles.route")); // * Profiles

  app.use("/projects", require("./projects.route")); // * Projects

  app.use("/media", require("./media.route")); // * Media

  app.use("/jobs", require("./jobs.route")); // * Jobs

  app.use("/chat", AuthGuard, require("./chat.route")); // * Chat

  app.use("/notifications", require("./notifications.route")); // * Notifications

  app.use("/reports", AuthGuard, require("./reports.route")); // * Reports

  app.use("/early-access", require("./early_access.route")); // * Early Access

  app.use("/search", require("./search.route")); // * Search

  // Route Not Found
  app.use((req, res, next) => {
    next(
      createHttpError(httpStatus.NOT_FOUND, {
        message: "Route not found.",
      })
    );
  });

  // Error Handling
  app.use((err, req, res, next) => {
    err.status = err.status || httpStatus.INTERNAL_SERVER_ERROR;

    const errType = getValues(httpStatus, "").find(
      (type) => httpStatus[type] === err.status
    );

    if (err.status === httpStatus.INTERNAL_SERVER_ERROR) {
      console.error(err);
    }

    return res.status(err.status).send({
      title: err.title,
      type: err.type || errType,
      message: err.message,
    });
  });
};
