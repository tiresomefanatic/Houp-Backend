const path = require("path");
const { transporter } = require("../connections/mailer.connection");
const renderer = require("./template_renderer");

module.exports = {
  sendEmailVerificationMail: async (email, url, cb) => {
    const html = renderer(
      path.join(__dirname, "../templates/email_verification.mjml"),
      { url }
    );
    transporter.sendMail(
      {
        from: `"Houp Support" <${process.env.MAILER_EMAIL}>`,
        to: email,
        subject: "Email verification mail from Houp",
        html,
      },
      cb
    );
  },
  sendForgotPasswordMail: async (email, url, cb) => {
    const html = renderer(
      path.join(__dirname, "../templates/forgot_password.mjml"),
      { url }
    );
    transporter.sendMail(
      {
        from: `"Houp Support" <${process.env.MAILER_EMAIL}>`,
        to: email,
        subject: "Forgot password verification mail from Houp",
        html,
      },
      cb
    );
  },
  sendChangePasswordMail: async (email, url, cb) => {
    const html = renderer(
      path.join(__dirname, "../templates/change_password.mjml"),
      { url }
    );
    transporter.sendMail(
      {
        from: `"Houp Support" <${process.env.MAILER_EMAIL}>`,
        to: email,
        subject: "Change password verification mail from Houp",
        html,
      },
      cb
    );
  },
};
