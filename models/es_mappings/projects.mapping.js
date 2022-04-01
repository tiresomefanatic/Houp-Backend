const { esClient } = require("../../connections/elasticsearch.connection");
const { mappings } = require("../../constants");

module.exports = {
  index: mappings.PROJECTS,
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
    project_team: {
      type: "nested",
      properties: {
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
        accepted: {
          type: "boolean",
        },
      },
    },
    project_jobs: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    project_followers: {
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
      path: "profile",
      select: "name profile_picture",
    },
    {
      path: "project_team.profile",
      select: "name profile_picture",
    },
  ],
};
