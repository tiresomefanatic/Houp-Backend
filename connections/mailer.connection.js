const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAILER_EMAIL,
    pass: process.env.MAILER_PASS,
  },
});

module.exports.verify = () => {
  transporter
    .verify()
    .then(() => {
      console.info("Mailer setup successfully...");
    })
    .catch((error) => {
      console.error("Mailer is down!");
      throw new Error(error);
    });
};

module.exports.transporter = transporter;
