const { esClient } = require("../../connections/elasticsearch.connection");
const { mappings } = require("../../constants");

module.exports = {
  index: mappings.CAST_ROLES,
  esClient,
  customProperties: {
    job: {
      properties: {
        project_title: {
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
        audition_schedule: {
          type: "date",
        },
        date: {
          type: "date",
        },
      },
    },
    role: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256,
        },
      },
    },
    payment: {
      type: "float",
    },
    description: {
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
      path: "job",
      select:
        "project_title project_type audition_location audition_address audition_schedule date closed",
    },
  ],
};
