const jwt = require("jsonwebtoken");

module.exports = (socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    try {
      socket.profile = jwt.verify(
        socket.handshake.query.token,
        process.env.JWT_SECRET,
        {
          issuer: process.env.JWT_ISSUER,
          subject: socket.handshake.headers.origin,
        }
      );

      if (!socket.profile) {
        return next(new Error("Authentication Error."));
      }

      return next();
    } catch (err) {
      return next(new Error("Authentication Error."));
    }
  } else {
    return next(new Error("Authentication Error."));
  }
};
