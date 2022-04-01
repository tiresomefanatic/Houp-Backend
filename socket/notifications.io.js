const authMiddleware = require("./auth.middleware");
const { ProfilesModel } = require("../models");
const NotificationsController = require("../controllers/notifications.controller");

const profilesOnline = {};

global.profilesOnline = profilesOnline;

module.exports = (io) => {
  const notif = io.of("/notif");

  // Authenticate Connected User
  notif.use(authMiddleware);

  notif.on("connection", async (socket) => {
    console.info(socket.id + " connected on Notifications Socket Server");

    if (
      profilesOnline[socket.profile.profile_id] &&
      profilesOnline[socket.profile.profile_id].notifSessions &&
      profilesOnline[socket.profile.profile_id].notifSessions.indexOf(
        socket.id
      ) === -1
    ) {
      profilesOnline[socket.profile.profile_id].notifSessions.push(socket.id);
    } else {
      const profile = await ProfilesModel.findById(
        socket.profile.profile_id
      ).populate("notifications");
      const notifications = profile.notifications.filter(
        (notif) => !notif.read_by.includes(socket.profile.profile_id)
      );

      profilesOnline[socket.profile.profile_id] = {
        chatSessions: [],
        notifSessions: [socket.id],
        notifications,
      };
    }

    socket.emit(
      "notifications",
      profilesOnline[socket.profile.profile_id].notifications
    );

    io.of("/notif").emit("active-profiles", Object.keys(profilesOnline));

    socket.on("disconnect", () => {
      console.info(
        socket.id + " disconnected from Notifications Socket Server"
      );

      if (
        profilesOnline[socket.profile.profile_id] &&
        profilesOnline[socket.profile.profile_id].notifSessions
      ) {
        const indx = profilesOnline[
          socket.profile.profile_id
        ].notifSessions.indexOf(socket.id);
        if (indx > -1) {
          profilesOnline[socket.profile.profile_id].notifSessions.splice(
            indx,
            1
          );
        }

        if (
          profilesOnline[socket.profile.profile_id].notifSessions.length === 0
        ) {
          delete profilesOnline[socket.profile.profile_id];
        }
      }

      io.of("/notif").emit("active-profiles", Object.keys(profilesOnline));
    });

    socket.on("read-notification", (notif_id) => {
      NotificationsController.readNotification({
        profile_id: socket.profile.profile_id,
        notification_id: notif_id,
      });
    });

    socket.on("read-all", () => {
      NotificationsController.readAllNotifications({
        profile_id: socket.profile.profile_id,
      });
    });
  });

  global.notifSocket = notif;

  return notif;
};
