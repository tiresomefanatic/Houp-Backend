const jwt = require("jsonwebtoken");
const { SessionsModel } = require("../models");
const httpStatus = require("../utils/http_status_codes");
const createHttpError = require("http-errors");

module.exports = async (req, res, next) => {
  const errTitle = "Error when checking authentication.";

  if (!req.header("Authorization")) {
    return next(
      createHttpError(httpStatus.UNAUTHORIZED, {
        title: errTitle,
        message: "Please make sure your request has an Authorization header.",
      })
    );
  }
  if (!req.header("Authorization").startsWith("Bearer ")) {
    return next(
      createHttpError(httpStatus.UNAUTHORIZED, {
        title: errTitle,
        message: "Invalid authentication scheme.",
      })
    );
  }

  const token = req.header("Authorization").split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER,
      subject: req.header("Origin"),
    });

    if (!payload) {
      return next(
        createHttpError(httpStatus.UNAUTHORIZED, {
          title: errTitle,
          message: "Invalid Token.",
        })
      );
    }

    const session = await SessionsModel.findOneAndUpdate(
      {
        jti: payload.jti,
      },
      {
        lastActiveOn: new Date(),
      },
      { new: true }
    );

    if (!session) {
      return next(
        createHttpError(httpStatus.UNAUTHORIZED, {
          title: errTitle,
          message: "Invalid Token.",
        })
      );
    }

    // Set Profile Info
    req.profile = payload;

    return next();
  } catch (error) {
    return next(
      createHttpError(httpStatus.UNAUTHORIZED, {
        title: errTitle,
        message: "Invalid Token.",
      })
    );
  }
};
