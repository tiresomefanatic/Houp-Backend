const mongoose = require("mongoose");

module.exports.connect = () => {
  mongoose.connect(
    `${process.env.DB_URL}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    },
    (error) => {
      if (error) {
        console.error("MongoDB is down!");
        throw new Error(error);
      } else {
        console.info("MongoDB connection established...");
      }
    }
  );
};
