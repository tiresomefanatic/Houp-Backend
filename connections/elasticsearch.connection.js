const elasticsearch = require("elasticsearch");

const client = new elasticsearch.Client({
  httpAuth: `${process.env.ES_USER}:${process.env.ES_PASS}`,
  hosts: [
    process.env.NODE_ENV === "development"
      ? process.env.ES_URL_DEV
      : process.env.ES_URL,
  ],
});

module.exports.ping = () => {
  client.ping(
    {
      requestTimeout: 30000,
    },
    (error) => {
      if (error) {
        console.error("ElasticSearch is down!");
        throw new Error(error);
      } else {
        console.info("ElasticSearch connection established...");
      }
    }
  );
};

module.exports.esClient = client;
