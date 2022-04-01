const router = require("express").Router();
const { JobsController } = require("../controllers");
const { AccessGuard, AuthGuard, upload } = require("../middlewares");

// Get all jobs posted
router.get("/all", JobsController.getJobs);
// Get all jobs posted related to a profession
router.get("/related", JobsController.getRelatedJobs);
// Get all jobs posted by profile
router.get("/all-profile/:id", JobsController.getPostedJobs);
// Get a job posted by profile by id
router.get("/:job_id", JobsController.getJob);

router.use("/roles", require("./job_roles.route")); // * Job Roles

// Add Authentication Guard to all the further routes
router.use(AuthGuard);

router.use("/applications", require("./applications.route")); // * Applications

// Post a new job
router.post(
  "/:id",
  AccessGuard(1),
  upload.jobMedia.single("cover"),
  upload.s3Upload(),
  JobsController.openJob
);
// Update a job
router.put(
  "/:id",
  AccessGuard(4),
  upload.jobMedia.single("cover"),
  upload.s3Upload("job"),
  JobsController.updateJob
);
// Close a job
router.delete("/:id", AccessGuard(4), JobsController.closeJob);
// Reopen a job
router.put("/reopen/:id", AccessGuard(4), JobsController.reopenJob);

// Upload/Update the project cover picture for job
router.post(
  "/cover/:id",
  AccessGuard(4),
  upload.jobMedia.single("cover"),
  upload.s3Upload("job"),
  JobsController.uploadCoverPic
);

module.exports = router;
