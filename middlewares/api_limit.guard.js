const rateLimit = require("express-rate-limit");
const httpStatus = require("../utils/http_status_codes");
const createHttpError = require("http-errors");

module.exports = (minutes = 15, maxRequests = 5) => {
  const errTitle = "Error when checking api limit.";

  return rateLimit({
    windowMs: minutes * 60 * 1000, // 15 minutes * 60 seconds * 1000 milliseconds
    max: maxRequests, // start blocking after {{maxRequests}} requests
    handler: (req, res, next) => {
      return next(
        createHttpError(httpStatus.TOO_MANY_REQUESTS, {
          title: errTitle,
          message:
            "Too many requests created from this IP, please try again later.",
        })
      );
    },
  });
};
