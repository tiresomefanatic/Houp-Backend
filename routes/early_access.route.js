const router = require("express").Router();
const EarlyAccessController = require("../controllers/early_access.controller");
const { AdminGuard, AuthGuard } = require("../middlewares");

// Get all early access profiles data
router.get("/", AuthGuard, AdminGuard, EarlyAccessController.getEarlyAccess);

// Apply for early access
router.post("/", EarlyAccessController.applyForEarlyAccess);

module.exports = router;
