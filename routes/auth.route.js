const router = require("express").Router();
const passport = require("passport");
const AuthController = require("../controllers/auth.controller");
const {
  AuthGuard,
  APILimitGuard,
  AccessGuard,
  AdminGuard,
} = require("../middlewares");

// Pings for frontend route guards
router.use("/ping", require("./pings.route")); // * Pings

// Sign Up a new profile
router.post("/register", APILimitGuard(15, 5), AuthController.signUp);

// Sign In a profile
router.post("/login", AuthController.signIn);

// Sign In a profile with passport google
router.get("/auth/google", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: JSON.stringify(req.query),
  })(req, res, next);
});
// Fallback for passport google auth
router.get(
  "/auth/google/callback",
  passport.authenticate("google"),
  AuthController.googleSignIn,
  AuthController.authenticate
);

// Sign In a profile with passport facebook
router.get("/auth/facebook", (req, res, next) => {
  passport.authenticate("facebook", {
    scope: ["email"],
    state: JSON.stringify(req.query),
  })(req, res, next);
});
// Fallback for passport facebook auth
router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook"),
  AuthController.facebookSignIn,
  AuthController.authenticate
);

// Sign In a profile with passport linkedin
router.get("/auth/linkedin", (req, res, next) => {
  passport.authenticate("linkedin", {
    state: JSON.stringify(req.query),
  })(req, res, next);
});
// Fallback for passport linkedin auth
router.get(
  "/auth/linkedin/callback",
  passport.authenticate("linkedin"),
  AuthController.linkedinSignIn,
  AuthController.authenticate
);

// Sign Out a profile
router.put("/logout", AuthGuard, AuthController.signOut);

// Trigger forgot password for sending reset email
router.put("/forgot-password", AuthController.forgotPassword);
// Trigger change password for sending reset email
router.put(
  "/change-password",
  AuthGuard,
  AccessGuard(2),
  AuthController.changePassword
);

// Confirm the email of a profile
router.put("/confirm-email", AuthController.confirmEmail);

// Reset the password of a profile by a token unauthorized
router.put(
  "/reset-password",
  APILimitGuard(15, 5),
  AuthController.resetPassword
);
// Change the password of a profile by a token and auth
router.put(
  "/reset-password-auth",
  AuthGuard,
  AccessGuard(2),
  APILimitGuard(15, 5),
  AuthController.resetPassword
);

// Add Admin role to profile
router.post("/admin/:id", AuthGuard, AdminGuard, AuthController.makeAdmin);
// Remove Admin role from profile
router.delete("/admin/:id", AuthGuard, AdminGuard, AuthController.removeAdmin);

module.exports = router;
