const Joi = require("@hapi/joi");
const createHttpError = require("http-errors");
const httpStatus = require("../utils/http_status_codes");
const { EarlyAccessModel } = require("../models");

module.exports = {
  getEarlyAccess: async (req, res, next) => {
    const errTitle = "Error when getting all early access profiles.";

    EarlyAccessModel.find()
      .exec()
      .then((docs) => {
        if (docs) {
          return res.status(httpStatus.OK).send(docs);
        } else {
          return next(
            createHttpError(httpStatus.NOT_FOUND, {
              title: errTitle,
              message: "Early Access Profiles Not Found.",
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
  applyForEarlyAccess: async (req, res, next) => {
    const errTitle = "Error when applying for early access.";

    const reqSchema = Joi.object({
      name: Joi.string().required(),
      city: Joi.string().required(),
      email: Joi.string().email().required(),
      mobile: Joi.string().required(),
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
      const ifAlreadyApplied = await EarlyAccessModel.findOne({
        $or: [
          {
            email: req.body.email,
          },
          {
            mobile: req.body.mobile,
          },
        ],
      });

      if (ifAlreadyApplied) {
        return next(
          createHttpError(httpStatus.CONFLICT, {
            title: errTitle,
            message: "Already applied for early access.",
          })
        );
      }

      const earlyAccess = new EarlyAccessModel(req.body).save();

      return res.status(httpStatus.OK).send(earlyAccess);
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
