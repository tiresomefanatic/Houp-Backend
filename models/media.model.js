const mongoose = require("mongoose");
// const mongoosastic = require("mongoosastic");
// const mapping = require("./es_mappings/media.mapping");
const { contentTypes, collections, fileTypes } = require("../constants");
const { getValues } = require("../utils/common_utils");

const mediaSchema = new mongoose.Schema(
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
    caption: {
      type: String,
      es_indexed: true,
    },
    tags: {
      type: [String],
      default: [],
      es_indexed: true,
    },
    cover_picture: {
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
    media: {
      type: [
        {
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
      ],
      es_indexed: true,
    },
    views: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.PROFILE,
        es_indexed: true,
      },
    ],
    stars: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.PROFILE,
        es_indexed: true,
      },
    ],
    content_types: {
      type: [
        {
          type: String,
          enum: getValues(contentTypes),
        },
      ],
    },
    date: {
      type: Date,
      required: true,
      es_indexed: true,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.COMMENT,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// // ES mapping
// mediaSchema.plugin(mongoosastic, mapping);

const Media = new mongoose.model(collections.MEDIA, mediaSchema);

// Media.createMapping((error) => {
//   if (error) {
//     console.error("Error when mapping media documents: ", error);
//   }
// });

// let count = 0;
// Media.synchronize()
//   .on("data", (err, doc) => {
//     count++;
//   })
//   .on("error", (error) => {
//     console.error("Error when indexing media documents: ", error);
//   })
//   .on("close", () => {
//     console.info("Indexed " + count + " media documents...");
//   });

module.exports = Media;
