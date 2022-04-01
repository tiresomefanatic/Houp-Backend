const { esClient } = require("../../connections/elasticsearch.connection");
const { mappings } = require("../../constants");

module.exports = {
  index: mappings.MEDIA,
  esClient,
  customProperties: {
    profile: {
      properties: {
        name: {
          type: "text",
          fields: {
            keyword: {
              type: "keyword",
              ignore_above: 256,
            },
          },
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
      },
    },
    caption: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    tags: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    cover_picture: {
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
    views: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    stars: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    content_types: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    date: {
      type: "date",
    },
  },
  populate: [
    {
      path: "profile",
      select: "name profile_picture",
    },
  ],
};
