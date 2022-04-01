const mongoose = require("mongoose");
// const mongoosastic = require("mongoosastic");
// const mapping = require("./es_mappings/jobs.mapping");
const { projectTypes, collections, fileTypes } = require("../constants");
const { getValues } = require("../utils/common_utils");

const jobSchema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.PROFILE,
      required: true,
      es_indexed: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.PROJECT,
      es_indexed: true,
    },
    project_title: {
      type: String,
      required: true,
      es_indexed: true,
    },
    project_description: {
      type: String,
      es_indexed: true,
    },
    project_type: {
      type: String,
      enum: getValues(projectTypes),
      required: true,
      es_indexed: true,
    },
    project_cover_picture: {
      type: {
        file_type: {
          type: String,
          enum: getValues(fileTypes),
          required: true,
        },
        file_name: {
          type: String,
          required: true,
        },
        dir_path: {
          type: String,
          required: true,
        },
        src: {
          type: String,
          required: true,
        },
      },
      es_indexed: true,
    },
    cast_roles: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: collections.CAST_ROLE,
        },
      ],
      default: [],
      es_indexed: true,
    },
    crew_roles: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: collections.CREW_ROLE,
        },
      ],
      default: [],
      es_indexed: true,
    },
    audition_date: {
      type: Date,
      es_indexed: true,
    },
    audition_location: {
      type: {
        lat: Number,
        lon: Number,
      },
      es_indexed: true,
    },
    audition_address: {
      type: String,
      es_indexed: true,
    },
    close_posting_on: {
      type: Date,
      es_indexed: true,
    },
    date: {
      type: Date,
      required: true,
      es_indexed: true,
    },
    applications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.APPLICATION,
      },
    ],
    closed: {
      type: Boolean,
      default: false,
      es_indexed: true,
    },
  },
  {
    timestamps: true,
  }
);

// // ES mapping
// jobSchema.plugin(mongoosastic, mapping);

const Job = new mongoose.model(collections.JOB, jobSchema);

// Job.createMapping((error) => {
//   if (error) {
//     console.error("Error when mapping job documents: ", error);
//   }
// });

// let count = 0;
// Job.synchronize()
//   .on("data", (err, doc) => {
//     count++;
//   })
//   .on("error", (error) => {
//     console.error("Error when indexing job documents: ", error);
//   })
//   .on("close", () => {
//     console.info("Indexed " + count + " job documents...");
//   });

module.exports = Job;
