const webPush = require("web-push");
const { subject, publicVapidKey } = require("../config/web_push.config");

module.exports.init = () => {
  webPush.setVapidDetails(
    subject,
    publicVapidKey,
    process.env.PRIVATE_VAPID_KEY
  );
  console.info("Web Push Vapid Details set...");
};
