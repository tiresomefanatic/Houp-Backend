const {
  addMessage: pushMessage,
  removeMessage,
} = require("../controllers/chat.controller");
const authMiddleware = require("./auth.middleware");

const profilesOnline = global.profilesOnline;

module.exports = (io) => {
  const chat = io.of("/chat");

  // Authenticate Connected User
  chat.use(authMiddleware);

  chat.on("connection", (socket) => {
    console.info(socket.id + " connected on Chat Socket Server");

    if (
      profilesOnline[socket.profile.profile_id] &&
      profilesOnline[socket.profile.profile_id].chatSessions &&
      profilesOnline[socket.profile.profile_id].chatSessions.indexOf(
        socket.id
      ) === -1
    ) {
      profilesOnline[socket.profile.profile_id].chatSessions.push(socket.id);
    }

    socket.on("disconnect", () => {
      console.info(socket.id + " disconnected from Chat Socket Server");

      if (
        profilesOnline[socket.profile.profile_id] &&
        profilesOnline[socket.profile.profile_id].chatSessions
      ) {
        const indx = profilesOnline[
          socket.profile.profile_id
        ].chatSessions.indexOf(socket.id);
        if (indx > -1) {
          profilesOnline[socket.profile.profile_id].chatSessions.splice(
            indx,
            1
          );
        }
      }
    });

    socket.on("forward-message", (data) => {
      data.convos.forEach((convo_id) => {
        pushMessage(
          {
            convo_id,
            profile_id: data.profile_id,
            message: data.message,
            link: data.link,
          },
          (err, res) => {
            if (err) {
              socket.emit("error", err);
            } else {
              socket.emit("success", res.message);

              res.profiles.forEach((profile_id) => {
                if (profilesOnline[profile_id]) {
                  profilesOnline[profile_id].chatSessions.forEach((id) => {
                    if (id !== socket.id) {
                      chat.to(id).emit("new-message", res.message);
                    }
                  });
                }
              });
            }
          }
        );
      });
    });

    socket.on("add-message", (data) => {
      pushMessage(data, (err, res) => {
        if (err) {
          socket.emit("error", err);
        } else {
          socket.emit("add-success", res.message);

          res.profiles.forEach((profile_id) => {
            if (profilesOnline[profile_id]) {
              profilesOnline[profile_id].chatSessions.forEach((id) => {
                if (id !== socket.id) {
                  chat.to(id).emit("new-message", res.message);
                }
              });
            }
          });
        }
      });
    });

    socket.on("remove-message", (data) => {
      removeMessage(data, (err, res) => {
        if (err) {
          socket.emit("error", err);
        } else {
          socket.emit("remove-success", res.message._id);

          res.profiles.forEach((profile_id) => {
            if (profilesOnline[profile_id]) {
              profilesOnline[profile_id].chatSessions.forEach((id) => {
                if (id !== socket.id) {
                  chat.to(id).emit("removed-message", res.message._id);
                }
              });
            }
          });
        }
      });
    });
  });

  return chat;
};
