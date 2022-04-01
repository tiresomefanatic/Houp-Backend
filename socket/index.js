const socketIO = require("socket.io");

module.exports.init = (server) => {
  const io = socketIO.listen(server, { cookie: false });

  // Add namespaces
  require("./notifications.io")(io);
  require("./chat.io")(io);

  return io;
};
