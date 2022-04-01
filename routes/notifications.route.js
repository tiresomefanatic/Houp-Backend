const router = require("express").Router();
const { NotificationsController } = require("../controllers");
const { AccessGuard, AuthGuard } = require("../middlewares");

// Get all notifications of a profile
router.get(
  "/all/:id",
  AuthGuard,
  AccessGuard(1),
  NotificationsController.getNotifications
);

// Subscribe to web push notifications
router.post("/subscribe", NotificationsController.subscribeNotifications);

module.exports = router;
