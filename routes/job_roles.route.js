const router = require("express").Router();
const { JobRolesController } = require("../controllers");
const { AccessGuard, AuthGuard } = require("../middlewares");

// Get all job roles of a job
router.get("/all/:job_id", JobRolesController.getJobRoles);
// Get a job role of a job by id
router.get("/:job_id", JobRolesController.getJobRole);

// Add Authentication Guard to all the further routes
router.use(AuthGuard);

// Add a new cast role to a job
router.post("/cast", AccessGuard(5), JobRolesController.addCastRole);
// Update a cast role of a job
router.put("/cast", AccessGuard(5), JobRolesController.updateCastRole);
// Add a new crew role to a job
router.post("/crew", AccessGuard(5), JobRolesController.addCrewRole);
// Update a crew role of a job
router.put("/crew", AccessGuard(5), JobRolesController.updateCrewRole);
// Remove a job role from a job
router.delete("/:id", AccessGuard(4), JobRolesController.removeJobRole);

module.exports = router;
