const config = {
  development: {
    WEB_URL: "http://localhost:3000/",
    API_URL: `http://localhost:${process.env.PORT}/`,
    API_HOST: `localhost:${process.env.PORT}`,
  },
  production: {
    WEB_URL: "https://houp.app/",
    API_URL: "https://api-houp.tk/",
    API_HOST: "api-houp.tk",
  },
};

module.exports = config[process.env.NODE_ENV];
