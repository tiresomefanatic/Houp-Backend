const { esClient } = require("../../connections/elasticsearch.connection");
const { mappings } = require("../../constants");

module.exports = {
  index: mappings.PROFILES,
  esClient,
  customProperties: {
    name: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    username: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    professions: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    date_of_birth: {
      type: "date",
    },
    gender: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    // TODO: Fix bug
    height: {
      properties: {
        absolute_value: {
          type: "float",
        },
      },
    },
    weight: {
      properties: {
        absolute_value: {
          type: "float",
        },
      },
    },
    skills: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    education: {
      properties: {
        gradScore: {
          type: "float",
        },
      },
    },
    languages: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    location: {
      type: "geo_point",
    },
    profile_picture: {
      properties: {
        file_type: {
          type: "text",
          fields: {
            keyword: {
              type: "keyword",
              ignore_above: 256,
            },
          },
        },
        file_name: {
          type: "text",
          fields: {
            keyword: {
              type: "keyword",
              ignore_above: 256,
            },
          },
        },
        dir_path: {
          type: "text",
          fields: {
            keyword: {
              type: "keyword",
              ignore_above: 256,
            },
          },
        },
        src: {
          type: "text",
          fields: {
            keyword: {
              type: "keyword",
              ignore_above: 256,
            },
          },
        },
      },
    },
    media: {
      type: "nested",
      properties: {
        stars: {
          type: "text",
          fields: {
            keyword: {
              type: "keyword",
              ignore_above: 256,
            },
          },
        },
      },
    },
    connections: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
  },
  populate: [
    {
      path: "media",
      select: "stars",
    },
  ],
};
