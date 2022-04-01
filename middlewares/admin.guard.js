const httpStatus = require("../utils/http_status_codes");
const createHttpError = require("http-errors");
const {roles} = require("../constants");

module.exports = (req, res, next) => {
  const errTitle = "Error when checking admin access.";

  if (req.profile) {
    if (req.profile.roles.indexOf(roles.ADMIN) > -1) {
      return next();
    } else {
      return next(
        createHttpError(httpStatus.FORBIDDEN, {
          title: errTitle,
          message: "Role doesn't have permission for this resource.",
        })
      );
    }
  } else {
    return next(
      createHttpError(httpStatus.UNAUTHORIZED, {
        title: errTitle,
        message: "Invalid Token.",
      })
    );
  }
};
