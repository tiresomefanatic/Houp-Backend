const router = require("express").Router();
const { ApplicationsController } = require("../controllers");
const { AccessGuard } = require("../middlewares");

// Get all applications of a job
router.get("/all/:id", AccessGuard(4), ApplicationsController.getJobApplications);
// Get all applications of a profile
router.get(
  "/all-profile/:id",
  AccessGuard(1),
  ApplicationsController.getProfileApplications
);
// Get an application of a job by id
router.get("/:id", AccessGuard(1), ApplicationsController.getApplication);
// Post a new application to a job
router.post("/", AccessGuard(2), ApplicationsController.postApplication);
// Remove an application from a job
router.delete("/:id", AccessGuard(1), ApplicationsController.removeApplication);

module.exports = router;
