const router = require("express").Router();
const ProjectsController = require("../controllers/projects.controller");
const { AccessGuard, AuthGuard, upload } = require("../middlewares");

// Get all projects
router.get("/all", ProjectsController.getAllProjects);
// Get all projects of a profile
router.get("/all-profile/:id", ProjectsController.getProfileProjects);
// Get an project of a profile by id
router.get("/:project_id", ProjectsController.getProject);
// Get all followers of a project
router.get("/follow/:project_id", ProjectsController.getProjectFollowers);

// Add Authentication Guard to all the further routes
router.use(AuthGuard);

// Get all projects of a profile that they're an admin of
router.get(
  "/all-profile-admin/:id",
  ProjectsController.getProfileAdminProjects
);

// Upload the project cover picture
router.post(
  "/cover/:id",
  AccessGuard(7),
  upload.projectMedia.single("cover"),
  upload.s3Upload("project"),
  ProjectsController.uploadCoverPic
);

// Update the admins of a project
router.put("/admins", AccessGuard(8), ProjectsController.updateAdmins);
// Update the team members of a project
router.put("/team", AccessGuard(8), ProjectsController.updateTeam);

// Get all the invites for the team member of all projects
router.get(
  "/team/invite/:id",
  AccessGuard(1),
  ProjectsController.getInvitesToProjects
);
// Create a project invite for sharing
router.post(
  "/team/invite-share",
  AccessGuard(8),
  ProjectsController.shareProjectInvite
);
// Accept a shared project invite
router.put(
  "/team/invite-share",
  AccessGuard(2),
  ProjectsController.acceptProjectInvite
);
// Resolve the invite for the team member of a project
router.put(
  "/team/invite",
  AccessGuard(2),
  ProjectsController.resolveInviteToProject
);
// Leave project as a team member or admin
router.delete("/team/:id", AccessGuard(1), ProjectsController.leaveProject);

// Follow a project
router.post("/follow/:id", AccessGuard(1), ProjectsController.followProject);
// UnFollow a project
router.delete(
  "/follow/:id",
  AccessGuard(1),
  ProjectsController.unFollowProject
);

// Post a new project to a profile
router.post(
  "/:id",
  AccessGuard(1),
  upload.projectMedia.single("cover"),
  upload.s3Upload(),
  ProjectsController.addProject
);
// Update an project of a profile or an admin
router.put(
  "/:id",
  AccessGuard(7),
  upload.projectMedia.single("cover"),
  upload.s3Upload("project"),
  ProjectsController.updateProject
);
// Delete an project from a profile
router.delete("/:id", AccessGuard(1), ProjectsController.removeProject);

module.exports = router;
