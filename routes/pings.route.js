const router = require("express").Router();
const { AuthGuard, AccessGuard, AdminGuard } = require("../middlewares");
const httpStatus = require("../utils/http_status_codes");

// Add Authentication Guard to all the further routes
router.use(AuthGuard);

// Check if authenticated
router.get("/auth", (req, res, next) => {
  res.status(httpStatus.OK).send({
    allowed: true,
    profile: req.profile.profile_id,
    email: req.profile.email,
  });
});
// Check if admin
router.get("/admin", AdminGuard, (req, res, next) => {
  res.status(httpStatus.OK).send({
    allowed: true,
    profile: req.profile.profile_id,
    email: req.profile.email,
  });
});
// Check if has profile access
router.get("/profile/:id", AccessGuard(3), (req, res, next) => {
  res.status(httpStatus.OK).send({
    allowed: true,
  });
});
// Check if has project access
router.get("/project/:id", AccessGuard(9), (req, res, next) => {
  res.status(httpStatus.OK).send({
    allowed: true,
  });
});
// Check if has media access
router.get("/media/:id", AccessGuard(12), (req, res, next) => {
  res.status(httpStatus.OK).send({
    allowed: true,
  });
});
// Check if has job access
router.get("/job/:id", AccessGuard(6), (req, res, next) => {
  res.status(httpStatus.OK).send({
    allowed: true,
  });
});
// Check if has conversation access
router.get("/chat/:id", AccessGuard(15), (req, res, next) => {
  res.status(httpStatus.OK).send({
    allowed: true,
  });
});

module.exports = router;
