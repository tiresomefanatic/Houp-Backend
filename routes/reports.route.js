const router = require("express").Router();
const { ReportsController } = require("../controllers");
const { AccessGuard, AdminGuard } = require("../middlewares");

// Report a profile
router.post("/profile/:id", AccessGuard(1), ReportsController.reportProfile);

// Report a project
router.post("/project/:id", AccessGuard(1), ReportsController.reportProject);

// Report a media
router.post("/media/:id", AccessGuard(1), ReportsController.reportMedia);

// Report a comment
router.post("/comment/:id", AccessGuard(1), ReportsController.reportComment);

// Get all reports
router.get("/", AdminGuard, ReportsController.getReports);

// Resolve a report
router.put(
  "/resolve/:id",
  AccessGuard(1),
  AdminGuard,
  ReportsController.resolveReport
);

module.exports = router;
