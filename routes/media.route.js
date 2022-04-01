const router = require("express").Router();
const MediaController = require("../controllers/media.controller");
const { AccessGuard, AuthGuard, upload } = require("../middlewares");

// Get all media of a profile
router.get("/all", MediaController.getAllMedia);
// Get all media of a profile
router.get("/all-profile/:id", MediaController.getProfileMedia);
// Get all media of a project
router.get("/all-project/:project_id", MediaController.getProjectMedia);
// Get of a media of a profile by id
router.get("/:media_id", MediaController.getMedia);

// Add Authentication Guard to all the further routes
router.use(AuthGuard);

// Upload media media
router.post(
  "/media/:id",
  AccessGuard(10),
  upload.mediaMedia.fields([
    { name: "cover_picture", maxCount: 1 },
    { name: "media" },
  ]),
  upload.s3Upload("media", true),
  MediaController.uploadMediaMedia
);
// Star a media
router.post("/star/:id", AccessGuard(1), MediaController.starMedia);
// Remove a star from a media
router.delete("/star/:id", AccessGuard(1), MediaController.unStarMedia);

// Get all saved media of a profile
router.get("/saved/:id", AccessGuard(1), MediaController.getSavedMedia);
// Save a media
router.post("/save/:id", AccessGuard(1), MediaController.saveMedia);
// Remove a save from a media
router.delete("/save/:id", AccessGuard(1), MediaController.unSaveMedia);

// Add a new comment to a media
router.post("/comment", AccessGuard(2), MediaController.addComment);
// Remove a comment from a media
router.delete("/comment/:id", AccessGuard(1), MediaController.removeComment);
// Star a comment of a media
router.post("/comment/star/:id", AccessGuard(1), MediaController.starComment);
// Remove a star from a comment of a media
router.delete(
  "/comment/star/:id",
  AccessGuard(1),
  MediaController.unStarComment
);

// Post a new media
router.post(
  "/:id",
  AccessGuard(1),
  upload.mediaMedia.fields([
    { name: "cover_picture", maxCount: 1 },
    { name: "media" },
  ]),
  upload.s3Upload("media", true),
  MediaController.addMedia
);
// Update a media
router.put(
  "/:id",
  AccessGuard(10),
  upload.mediaMedia.fields([
    { name: "cover_picture", maxCount: 1 },
    { name: "media" },
  ]),
  upload.s3Upload("media", true),
  MediaController.updateMedia
);
// Remove a media
router.delete("/:id", AccessGuard(10), MediaController.removeMedia);

module.exports = router;
