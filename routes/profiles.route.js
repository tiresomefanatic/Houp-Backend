const router = require("express").Router();
const ProfilesController = require("../controllers/profiles.controller");
const {
  AdminGuard,
  AccessGuard,
  AuthGuard,
  upload,
} = require("../middlewares");

// Get all profiles accessible to an admin
router.get(
  "/all/admin",
  AuthGuard,
  AdminGuard,
  ProfilesController.getAllProfilesAdmin
);
// Get all profiles that are public
router.get("/all", ProfilesController.getAllProfiles);
// Get a profile by id
router.get("/:id", ProfilesController.getProfileInfo);

// Add Authentication Guard to all the further routes
router.use(AuthGuard);

// Validate User Name
router.get("/validate/:id", ProfilesController.validateUserName);

// Post new profile information
router.post("/info", AccessGuard(2), ProfilesController.postProfileInfo);
// Update profile information
router.put("/info", AccessGuard(2), ProfilesController.updateProfileInfo);

// Get all connections of a profile
router.get(
  "/connections/:id",
  AccessGuard(1),
  ProfilesController.getConnections
);
// Remove a connection from another profile
router.delete(
  "/connections/:id",
  AccessGuard(1),
  ProfilesController.removeConnection
);

// Add a new connection request to another profile
router.post(
  "/connections/:id",
  AccessGuard(1),
  ProfilesController.addConnectionRequest
);
// Get all pending connection requests of a profile
router.get(
  "/connections/pending/:id",
  AccessGuard(1),
  ProfilesController.getPendingConnections
);
// Resolve a pending connection request
router.put(
  "/connections/pending/:id",
  AccessGuard(1),
  ProfilesController.resolveConnectionRequest
);
// Remove a pending connection request
router.delete(
  "/connections/pending/:id",
  AccessGuard(1),
  ProfilesController.removeConnectionRequest
);

// Upload the profile picture
router.post(
  "/avatar/:id",
  AccessGuard(1),
  upload.profileMedia("avatar").single("avatar"),
  upload.s3Upload("profile_avatar"),
  ProfilesController.uploadAvatar
);
// Remove the profile picture
router.delete(
  "/avatar/:id",
  AccessGuard(1),
  upload.s3Upload("profile_avatar"),
  ProfilesController.deleteAvatar
);

// Upload the profile cover picture
router.post(
  "/cover/:id",
  AccessGuard(1),
  upload.profileMedia("cover").single("cover"),
  upload.s3Upload("profile_cover"),
  ProfilesController.uploadCoverPic
);
// Remove the profile cover picture
router.delete(
  "/cover/:id",
  AccessGuard(1),
  upload.s3Upload("profile_cover"),
  ProfilesController.deleteCoverPic
);

// Get all blocked profiles of a profile
router.get(
  "/blocked-profiles/:id",
  AccessGuard(1),
  ProfilesController.getBlockedProfiles
);
// Block another profile
router.put("/block/:id", AccessGuard(1), ProfilesController.blockProfile);
// Remove a block of another profile
router.put("/unblock/:id", AccessGuard(1), ProfilesController.unBlockProfile);

module.exports = router;
