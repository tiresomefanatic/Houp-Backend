const Joi = require("@hapi/joi");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const createHttpError = require("http-errors");
const config = require("../config/config");
const httpStatus = require("../utils/http_status_codes");
const { ProfilesModel, EmailTokensModel, SessionsModel } = require("../models");
const { roles } = require("../constants");
const { isObjectIdValid, queryObjToString } = require("../utils/common_utils");
const {
  sendEmailVerificationMail,
  sendForgotPasswordMail,
  sendChangePasswordMail,
} = require("../mailer/send_mail");

module.exports = {
  signUp: async (req, res, next) => {
    const errTitle = "Error when signing up.";

    const reqSchema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      tc_accepted: Joi.boolean().strict().required(),
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
      if (!req.body.tc_accepted) {
        return next(
          createHttpError(httpStatus.FORBIDDEN, {
            title: errTitle,
            message: "Please accept Terms & Conditions to Sign Up.",
          })
        );
      }

      const profileExists = await ProfilesModel.findOne({
        email: req.body.email,
      });
      if (profileExists) {
        return next(
          createHttpError(httpStatus.CONFLICT, {
            title: errTitle,
            message: "Email already exists.",
          })
        );
      }

      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt); // Hashed password

      req.body.roles = [roles.USER];

      const profile = new ProfilesModel(req.body);
      await profile.save();

      // Email verification mail to be send
      const token = crypto.randomBytes(40).toString("hex");

      await new EmailTokensModel({
        profile: profile._id,
        email: profile.email,
        token,
      }).save();

      const url =
        config.WEB_URL +
        "verify-email?email=" +
        profile.email +
        "&token=" +
        token;
      sendEmailVerificationMail(profile.email, url, (err) => {
        if (err) {
          return next(
            createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
              title: errTitle,
              message: err,
            })
          );
        } else {
          return res.status(httpStatus.CREATED).send({
            profile_id: profile._id,
            email: profile.email,
            message: "Verification email has been sent.",
          });
        }
      });
    } catch (error) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: error,
        })
      );
    }
  },
  signIn: async (req, res, next) => {
    const errTitle = "Error when signing in.";

    const reqSchema = Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
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
      const profile = await ProfilesModel.findOne({
        $or: [
          {
            email: req.body.username,
          },
          {
            username: req.body.username,
          },
        ],
      });

      if (!profile) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Profile with such username or email doesn't exist.",
          })
        );
      }

      if (!profile.email_verified) {
        return next(
          createHttpError(httpStatus.UNAUTHORIZED, {
            title: errTitle,
            message: "Email is not verified.",
          })
        );
      }

      if (!profile.password) {
        return next(
          createHttpError(httpStatus.UNAUTHORIZED, {
            title: errTitle,
            message: "Invalid auth, try social login instead.",
          })
        );
      }

      const isValidPwd = await bcrypt.compare(
        req.body.password,
        profile.password
      );
      if (!isValidPwd) {
        return next(
          createHttpError(httpStatus.UNAUTHORIZED, {
            title: errTitle,
            message: "Invalid password.",
          })
        );
      }

      const jti = crypto.randomBytes(12).toString("hex");
      const url = req.header("Origin") || config.WEB_URL;

      // ? Add Expiration Date?
      const token = jwt.sign(
        {
          profile_id: profile._id,
          email: profile.email,
          roles: profile.roles,
          sitename: url,
        },
        process.env.JWT_SECRET,
        {
          issuer: process.env.JWT_ISSUER,
          jwtid: jti,
          subject: url,
        }
      );
      req.header("Authorization", token);

      await new SessionsModel({
        profile: profile._id,
        loggedInAt: new Date(),
        jti,
        ipAddress: req.ip,
      }).save();

      // Check if profile has all required information
      let isValid = true;
      if (
        !profile.name ||
        !profile.username ||
        !profile.professions ||
        !profile.date_of_birth
      ) {
        isValid = false;
      }

      return res.status(httpStatus.OK).send({
        is_valid: isValid,
        profile_id: profile._id,
        email: profile.email,
        token,
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
  signOut: (req, res, next) => {
    const errTitle = "Error when signing out.";

    SessionsModel.findOneAndUpdate(
      {
        profile: req.profile.profile_id,
        jti: req.profile.jti,
      },
      {
        loggedOutAt: new Date(),
        jti: null,
      },
      { new: true }
    )
      .then(() => {
        return res.status(httpStatus.OK).send({
          message: "Logout Successful.",
        });
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
  forgotPassword: async (req, res, next) => {
    const errTitle = "Error when processing forgotten password.";

    const reqSchema = Joi.object({
      email: Joi.string().email().required(),
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
      const profile = await ProfilesModel.findOne({
        email: req.body.email,
      });

      if (!profile) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Profile with email not found.",
          })
        );
      }

      if (!profile.email_verified) {
        return next(
          createHttpError(httpStatus.UNAUTHORIZED, {
            title: errTitle,
            message: "Email is not verified.",
          })
        );
      }

      const token = crypto.randomBytes(40).toString("hex");

      await EmailTokensModel.deleteMany({
        email: profile.email,
      });

      await new EmailTokensModel({
        profile: profile._id,
        email: profile.email,
        token,
      }).save();

      const url =
        config.WEB_URL +
        "reset-password?email=" +
        profile.email +
        "&token=" +
        token;
      sendChangePasswordMail(profile.email, url, (err) => {
        if (err) {
          return next(
            createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
              title: errTitle,
              message: err,
            })
          );
        } else {
          return res.status(httpStatus.OK).send({
            message:
              "A password reset mail has been sent to your registered mail Id.",
          });
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
  changePassword: async (req, res, next) => {
    const errTitle = "Error when changing password.";

    try {
      const profile = await ProfilesModel.findById(req.body.profile_id);

      const token = crypto.randomBytes(40).toString("hex");

      await EmailTokensModel.deleteMany({
        email: profile.email,
      });

      await new EmailTokensModel({
        profile: profile._id,
        email: profile.email,
        token,
      }).save();

      const url =
        config.WEB_URL +
        "reset-password?email=" +
        profile.email +
        "&token=" +
        token;
      sendForgotPasswordMail(profile.email, url, (err) => {
        if (err) {
          return next(
            createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
              title: errTitle,
              message: err,
            })
          );
        } else {
          return res.status(httpStatus.OK).send({
            message:
              "A password reset mail has been sent to your registered mail Id.",
          });
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
  confirmEmail: async (req, res, next) => {
    const errTitle = "Error when confirming email.";

    const reqSchema = Joi.object({
      email: Joi.string().email().required(),
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
      const profile = await ProfilesModel.findOne({
        email: req.body.email,
      });

      if (!profile) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Profile with such email doesn't exist.",
          })
        );
      }

      if (profile.email_verified) {
        return res.status(httpStatus.OK).send({
          message: "Email already verified.",
        });
      }

      const token = await EmailTokensModel.findOne({
        profile: profile._id,
        email: req.body.email,
        token: req.body.token,
      });

      if (!token) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Token Not Found.",
          })
        );
      }

      await EmailTokensModel.findByIdAndDelete(token._id);

      // const expiryTime = 60 * 60 * 1000; //* One Hour

      // if (new Date() - new Date(token.createdAt) >= expiryTime) {
      //   return next(
      //     createHttpError(httpStatus.FORBIDDEN, {
      //       title: errTitle,
      //       message: "Token Expired.",
      //     })
      //   );
      // }

      await ProfilesModel.findByIdAndUpdate(
        profile._id,
        {
          email_verified: {
            verification_date: new Date(),
          },
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send({
        confirmed: true,
        message: "Email verified successfully.",
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
  resetPassword: async (req, res, next) => {
    const errTitle = "Error when resetting password.";

    const reqSchema = Joi.object({
      profile_id: Joi.string().custom((value, helper) => {
        if (!isObjectIdValid(value)) {
          return helper.error("Profile ID is not a valid Object ID.");
        }
        return value;
      }),
      email: Joi.string().email().required(),
      token: Joi.string().required(),
      password: Joi.string().required().min(6),
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
      let profile;
      if (req.body.profile_id) {
        profile = await ProfilesModel.findById(req.body.profile_id);
      } else {
        profile = await ProfilesModel.findOne({ email: req.body.email });
      }

      if (!profile) {
        return next(
          createHttpError(httpStatus.NOT_FOUND, {
            title: errTitle,
            message: "Profile Not Found.",
          })
        );
      }

      const token = await EmailTokensModel.findOne({
        profile: profile._id,
        email: profile.email,
        token: req.body.token,
      });

      if (!token) {
        return next(
          createHttpError(httpStatus.UNAUTHORIZED, {
            title: errTitle,
            message: "Permission Not Granted.",
          })
        );
      }

      await EmailTokensModel.findByIdAndDelete(token._id);

      const expiryTime = 60 * 60 * 1000; //* One Hour

      if (new Date() - new Date(token.createdAt) >= expiryTime) {
        return next(
          createHttpError(httpStatus.FORBIDDEN, {
            title: errTitle,
            message: "Token Expired.",
          })
        );
      }

      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash(req.body.password, salt); // Hashed password

      await ProfilesModel.findByIdAndUpdate(
        profile._id,
        {
          password,
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send({
        message: "Password updated successfully.",
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
  makeAdmin: async (req, res, next) => {
    const errTitle = "Error when setting admin.";

    try {
      const profile = await ProfilesModel.findByIdAndUpdate(
        req.params.id,
        {
          $addToSet: {
            roles: roles.ADMIN,
          },
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send(profile);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  removeAdmin: async (req, res, next) => {
    const errTitle = "Error when removing admin.";

    try {
      const profile = await ProfilesModel.findByIdAndUpdate(
        req.params.id,
        {
          $pull: {
            roles: roles.ADMIN,
          },
        },
        { new: true }
      );

      return res.status(httpStatus.OK).send(profile);
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  authenticate: async (req, res, next) => {
    try {
      const profile = await ProfilesModel.findById(req.profile);

      const jti = crypto.randomBytes(12).toString("hex");
      const url = config.WEB_URL.slice(0, -1);

      // ? Add Expiration Date?
      const token = jwt.sign(
        {
          profile_id: profile._id,
          email: profile.email,
          roles: profile.roles,
          sitename: url,
        },
        process.env.JWT_SECRET,
        {
          issuer: process.env.JWT_ISSUER,
          jwtid: jti,
          subject: url,
        }
      );
      req.header("Authorization", token);

      await new SessionsModel({
        profile: profile._id,
        loggedInAt: new Date(),
        jti,
        ipAddress: req.ip,
      }).save();

      // Check if profile has all required information
      let isValid = true;
      if (
        !profile.name ||
        !profile.username ||
        !profile.professions ||
        !profile.date_of_birth
      ) {
        isValid = false;
      }

      let redirectURL = `${config.WEB_URL}login`;
      const queryString = queryObjToString(JSON.parse(req.query.state));
      if (queryString.length) {
        redirectURL += queryString + `&token=${token}&isInvalid=${!isValid}`;
      } else {
        redirectURL += `?token=${token}&isInvalid=${!isValid}`;
      }

      return res.redirect(301, redirectURL);
    } catch (e) {
      return res.redirect(301, `${config.WEB_URL}login?error=Invalid Auth.`);
    }
  },
  googleSignIn: async (req, res, next) => {
    try {
      if (req.user) {
        const profile = req.user._json;

        const { email, name } = profile;

        const profileExists = await ProfilesModel.findOne({
          email: email,
        });

        if (profileExists) {
          req.profile = profileExists._id;
        } else {
          const newProfile = await new ProfilesModel({
            name,
            email,
            tc_accepted: true,
            roles: [roles.USER],
            email_verified: {
              verification_date: new Date(),
            },
          }).save();

          req.profile = newProfile._id;
        }

        return next();
      } else {
        return res.redirect(301, `${config.WEB_URL}login?error=Invalid Auth.`);
      }
    } catch (e) {
      return res.redirect(301, `${config.WEB_URL}login?error=Invalid Auth.`);
    }
  },
  facebookSignIn: async (req, res, next) => {
    try {
      if (req.user) {
        const profile = req.user._json;

        const { email, first_name, last_name } = profile;
        const name = `${first_name} ${last_name}`;

        const profileExists = await ProfilesModel.findOne({
          email: email,
        });

        if (profileExists) {
          req.profile = profileExists._id;
        } else {
          const newProfile = await new ProfilesModel({
            name,
            email,
            tc_accepted: true,
            roles: [roles.USER],
            email_verified: {
              verification_date: new Date(),
            },
          }).save();

          req.profile = newProfile._id;
        }

        return next();
      } else {
        return res.redirect(301, `${config.WEB_URL}login?error=Invalid Auth.`);
      }
    } catch (e) {
      return res.redirect(301, `${config.WEB_URL}login?error=Invalid Auth.`);
    }
  },
  linkedinSignIn: async (req, res, next) => {
    try {
      if (req.user) {
        const email = req.user.emails[0].value;
        const name = req.user.displayName;

        const profileExists = await ProfilesModel.findOne({
          email: email,
        });

        if (profileExists) {
          req.profile = profileExists._id;
        } else {
          const newProfile = await new ProfilesModel({
            name,
            email,
            tc_accepted: true,
            roles: [roles.USER],
            email_verified: {
              verification_date: new Date(),
            },
          }).save();

          req.profile = newProfile._id;
        }

        return next();
      } else {
        return res.redirect(301, `${config.WEB_URL}login?error=Invalid Auth.`);
      }
    } catch (e) {
      return res.redirect(301, `${config.WEB_URL}login?error=Invalid Auth.`);
    }
  },
};
