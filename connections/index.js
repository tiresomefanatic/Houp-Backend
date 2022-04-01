const mongodb = require("./mongodb.connection");
// const elasticsearch = require("./elasticsearch.connection");
const mailer = require("./mailer.connection");
const webpush = require("./web_push.connection");

module.exports = {
  init: () => {
    mongodb.connect();
    // elasticsearch.ping();
    mailer.verify();
    webpush.init();
  },
};
