module.exports = {
  AccessGuard: require("./access.guard"),
  AuthGuard: require("./auth.guard"),
  AdminGuard: require("./admin.guard"),
  APILimitGuard: require("./api_limit.guard"),
  upload: require("./upload.middleware"),
};
