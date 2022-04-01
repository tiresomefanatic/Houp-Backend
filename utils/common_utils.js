const { notificationTypes } = require("../constants");

const ObjectId = require("mongoose").Types.ObjectId;

const truncate = (input, length) =>
  input.length > length ? `${input.substring(0, length)}...` : input;

const parseNotifMessage = (notifMsg, data) => {
  let message = notifMsg;
  const regexp = /@{(.*?)\}/g;
  let found = regexp.exec(notifMsg);
  while (found) {
    message = message.replace(found[0], `${data[found[1].split(":")[0]]}`);
    found = regexp.exec(notifMsg);
  }
  return message;
};

module.exports = {
  // * Check if a string is a MongoDB ObjectID or not
  isObjectIdValid: (id) =>
    ObjectId.isValid(id)
      ? String(new ObjectId(id) === id)
        ? true
        : false
      : false,
  // * Get Values or Keys of a constant object with filter
  getValues: (obj, key, filter = {}) =>
    Object.keys(obj)
      .filter((k) => {
        // If Filter Argument is provided filter through each filter key
        const filterKeys = Object.keys(filter);
        if (filterKeys.length) {
          return filterKeys.every((fKey) => {
            return obj[k][fKey] === filter[fKey];
          });
        } else {
          // If no Filter Argument is provided return all the values
          return true;
        }
      })
      .map((k) => {
        if (key !== undefined) {
          // If Key Argument is empty string return all the object keys
          if (key === "") {
            return k;
          }

          // If Key Argument exists return all the nested objects with each key seperated by "."
          const keys = key.split(".");
          let res = obj[k];
          keys.forEach((objKey) => {
            if (res) {
              res = res[objKey];
            }
          });
          return res;
        }
        // If no Key Argument is provided return the values of the object
        return obj[k];
      }),
  // * Get a string with all words having first uppercase letter and rest being lowercase
  formatString: (string) =>
    string
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  // * Generate router query string from query object
  queryObjToString: (query) => {
    const keys = Object.keys(query);
    if (keys.length > 0) {
      let string = "?";
      keys.forEach((key) => {
        string += `${key}=${query[key]}&`;
      });
      string = string.slice(0, -1);
      return string;
    } else {
      return "";
    }
  },
  // * Truncate String to specific length
  truncate,
  // * Parse Notification Message
  getNotifMessage: (notification) => {
    switch (notification.type) {
      case notificationTypes.PROJECT_ADMIN: {
        return parseNotifMessage(notification.message, {
          profile: notification.mentioned_profiles.length
            ? notification.mentioned_profiles[0].name
            : null,
          project: notification.mentioned_projects.length
            ? notification.mentioned_projects[0].project_title
            : null,
        });
      }
      case notificationTypes.PROJECT_FOLLOW: {
        return parseNotifMessage(notification.message, {
          profile: notification.mentioned_profiles.length
            ? notification.mentioned_profiles[0].name
            : null,
          project: notification.mentioned_projects.length
            ? notification.mentioned_projects[0].project_title
            : null,
        });
      }
      case notificationTypes.PROJECT_UPDATE: {
        return parseNotifMessage(notification.message, {
          project: notification.mentioned_projects.length
            ? notification.mentioned_projects[0].project_title
            : null,
        });
      }
      case notificationTypes.NEW_MEDIA_STAR: {
        return parseNotifMessage(notification.message, {
          profile: notification.mentioned_profiles.length
            ? notification.mentioned_profiles[0].name
            : null,
          media: notification.mentioned_media.length
            ? truncate(notification.mentioned_media[0].caption, 10)
            : null,
        });
      }
      case notificationTypes.JOB_UPDATE: {
        return parseNotifMessage(notification.message, {
          profile: notification.mentioned_profiles.length
            ? notification.mentioned_profiles[0].name
            : null,
          job: notification.mentioned_jobs.length
            ? notification.mentioned_jobs[0].project_title
            : null,
        });
      }
      case notificationTypes.NEW_CHAT_MESSAGE: {
        return parseNotifMessage(notification.message, {
          profile: notification.mentioned_profiles.length
            ? notification.mentioned_profiles[0].name
            : null,
        });
      }
      case notificationTypes.NEW_MEDIA_COMMENT: {
        return parseNotifMessage(notification.message, {
          profile: notification.mentioned_profiles.length
            ? notification.mentioned_profiles[0].name
            : null,
          media: notification.mentioned_media.length
            ? truncate(notification.mentioned_media[0].caption, 10)
            : null,
        });
      }
      case notificationTypes.NEW_MEDIA_COMMENT_STAR: {
        return parseNotifMessage(notification.message, {
          profile: notification.mentioned_profiles.length
            ? notification.mentioned_profiles[0].name
            : null,
          media: notification.mentioned_media.length
            ? truncate(notification.mentioned_media[0].caption, 10)
            : null,
        });
      }
      default: {
        return null;
      }
    }
  },
};
