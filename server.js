"use strict";
require("dotenv").config();

if (!process.env.NODE_ENV) {
  console.error("Update/set .env file before you start...");
  process.exit();
}

const http = require("http");
// const https = require("https");
const fs = require("fs");
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const LinkedinStrategy = require("passport-linkedin-oauth2").Strategy;

const config = require("./config/config");

const app = express();

const PORT = process.env.PORT || 4000;

// // Set Environment
// process.env.NODE_ENV = "production";

// Passport Config
passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${config.API_URL}auth/google/callback`,
    },
    (accessToken, refreshToken, profile, cb) => {
      return cb(null, profile);
    }
  )
);
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${config.API_URL}auth/facebook/callback`,
      profileFields: ["emails", "name"],
    },
    (accessToken, refreshToken, profile, cb) => {
      return cb(null, profile);
    }
  )
);
passport.use(
  new LinkedinStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: `${config.API_URL}auth/linkedin/callback`,
      scope: ["r_emailaddress", "r_liteprofile"],
    },
    (accessToken, refreshToken, profile, cb) => {
      return cb(null, profile);
    }
  )
);

// Middlewares
app.use(morgan("dev"));
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());

// Database connections
const connections = require("./connections");
connections.init();

// Root Route
app.get("/", (req, res, next) => {
  res.send({
    message: "Welcome to Houp REST API Server!",
  });
});
// Initialize all Routes
const routes = require("./routes");
routes.init(app);

// Create HTTP Server
// let server;
// if (process.env.NODE_ENV === "development") {
//   server = https.createServer(
//     {
//       cert: fs.readFileSync(path.join(__dirname, "ssl", "server.crt")),
//       key: fs.readFileSync(path.join(__dirname, "ssl", "server.key")),
//     },
//     app
//   );
// } else {
//   server = http.createServer(app);
// }

const server = http.createServer(app);

// Initialize Socket Connection
const socketIO = require("./socket");
socketIO.init(server);

// Watch changes to model to push notifications
const watch = require("./utils/models.watch");
watch.init();

// Check Public Folder Structure
[
  "./public",
  "./public/images",
  "./public/images/avatars",
  "./public/images/covers",
  "./public/images/media_media",
  "./public/images/job_covers",
  "./public/images/project_covers",
  "./public/videos",
  "./public/videos/media_media",
  "./public/videos/media_media_thumbnails",
  "./public/audios",
].forEach((relPath) => {
  const dir = path.join(__dirname, relPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server listening to PORT ${PORT}...`);
});
