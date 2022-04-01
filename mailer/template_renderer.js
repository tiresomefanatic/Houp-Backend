const fs = require("fs");
const mustache = require("mustache");
const mjml = require("mjml");

module.exports = (path, data) => {
  const mjmlTemplate = fs
    .readFileSync(path, {
      encoding: "utf-8",
    })
    .toString();
  const renderedMJML = mustache.render(mjmlTemplate, data);
  return mjml(renderedMJML).html;
};
