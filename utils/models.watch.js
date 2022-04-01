const { JobsModel } = require("../models");
const NotificationsController = require("../controllers/notifications.controller");
const { notificationTypes } = require("../constants");

module.exports.init = () => {
  JobsModel.watch().on("change", async (changes) => {
    if (changes.operationType === "update") {
      const updatedFields = Object.keys(
        changes.updateDescription.updatedFields
      );
      const checkFields = ["applications", "updatedAt"];
      const checkUpdatedFields = updatedFields.filter(
        (field) => !checkFields.includes(field)
      );
      if (checkUpdatedFields.length) {
        // Send Notification to job applicants
        const job_id = changes.documentKey._id.toString();
        const job = await JobsModel.findById(job_id).populate("applications");
        const notif_profiles = [
          ...new Set(
            job.applications.map((application) =>
              application.profile.toString()
            )
          ),
        ];
        const profile_from = job.profile;
        const notification = {
          profiles: notif_profiles.map((id) => id.toString()),
          type: notificationTypes.JOB_UPDATE,
          message: `Job @{job:${job_id}} has been updated`,
          action: `/job/${job_id}`,
          mentioned_profiles: [profile_from].map((id) => id.toString()),
          mentioned_jobs: [job_id].map((id) => id.toString()),
        };

        await NotificationsController.pushNotification(notification);
      }
    }
  });
};
