const mongoose = require("mongoose");
// const mongoosastic = require("mongoosastic");
// const mapping = require("./es_mappings/projects.mapping");
const {
  projectTypes,
  professions,
  collections,
  fileTypes,
} = require("../constants");
const { getValues } = require("../utils/common_utils");

const projectSchema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.PROFILE,
      required: true,
      es_indexed: true,
    },
    project_admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.PROFILE,
      },
    ],
    project_title: {
      type: String,
      required: true,
      es_indexed: true,
    },
    project_description: {
      type: String,
      required: true,
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
    project_media: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.MEDIA,
      },
    ],
    project_team: [
      {
        role: {
          type: String,
          enum: getValues(professions, "role"),
          required: true,
        },
        profile: {
          type: mongoose.Schema.Types.ObjectId,
          ref: collections.PROFILE,
          required: true,
          es_indexed: true,
        },
        accepted: {
          type: Boolean,
          default: false,
          es_indexed: true,
        },
      },
    ],
    project_jobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.JOB,
        es_indexed: true,
      },
    ],
    project_followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.PROFILE,
        es_indexed: true,
      },
    ],
    project_views: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.PROFILE,
        es_indexed: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// // ES mapping
// projectSchema.plugin(mongoosastic, mapping);

const Project = new mongoose.model(collections.PROJECT, projectSchema);

// Project.createMapping((error) => {
//   if (error) {
//     console.error("Error when mapping project documents: ", error);
//   }
// });

// let count = 0;
// Project.synchronize()
//   .on("data", (err, doc) => {
//     count++;
//   })
//   .on("error", (error) => {
//     console.error("Error when indexing project documents: ", error);
//   })
//   .on("close", () => {
//     console.info("Indexed " + count + " project documents...");
//   });

module.exports = Project;
