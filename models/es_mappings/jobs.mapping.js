const { esClient } = require("../../connections/elasticsearch.connection");
const { mappings } = require("../../constants");

module.exports = {
  index: mappings.JOBS,
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
    project: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    project_title: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    project_description: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    project_type: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    project_cover_picture: {
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
    cast_roles: {
      type: "nested",
      properties: {
        role: {
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
    crew_roles: {
      type: "nested",
      properties: {
        role: {
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
    audition_date: {
      type: "date",
    },
    audition_location: {
      type: "geo_point",
    },
    audition_address: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    close_posting_on: {
      type: "date",
    },
    date: {
      type: "date",
    },
    closed: {
      type: "boolean",
    },
  },
  populate: [
    {
      path: "profile",
      select: "name profile_picture",
    },
    {
      path: "cast_roles",
      select: "role",
    },
    {
      path: "crew_roles",
      select: "role",
    },
  ],
  filter: (doc) => {
    return doc.closed;
  },
};
