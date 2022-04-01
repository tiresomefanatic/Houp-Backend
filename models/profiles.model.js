const mongoose = require("mongoose");
// const mongoosastic = require("mongoosastic");
// const mapping = require("./es_mappings/profiles.mapping");
const {
  roles,
  genders,
  professions,
  collections,
  units,
  languages,
  grades,
  fileTypes,
} = require("../constants");
const { getValues } = require("../utils/common_utils");

const profileSchema = new mongoose.Schema(
  {
    roles: [
      {
        type: String,
        enum: getValues(roles),
        required: true,
      },
    ],
    profile_picture: {
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
    name: {
      type: String,
      es_indexed: true,
    },
    username: {
      type: String,
      es_indexed: true,
    },
    bio: {
      type: String,
    },
    professions: [
      {
        type: String,
        enum: getValues(professions, "role"),
        es_indexed: true,
      },
    ],
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
    },
    date_of_birth: {
      type: Date,
      es_indexed: true,
    },
    gender: {
      type: String,
      enum: getValues(genders).concat([null]),
      es_indexed: true,
    },
    height: {
      type: {
        unit: {
          type: String,
          enum: getValues(units, "length.unit"),
        },
        value: {
          type: Number,
        },
        absolute_value: {
          type: Number,
          es_indexed: true,
        },
      },
      ex_indexed: true,
    },
    weight: {
      type: {
        unit: {
          type: String,
          enum: getValues(units, "mass.unit"),
        },
        value: {
          type: Number,
        },
        absolute_value: {
          type: Number,
          es_indexed: true,
        },
      },
      ex_indexed: true,
    },
    skills: [
      {
        type: String,
        es_indexed: true,
      },
    ],
    education: {
      type: [
        {
          school: {
            type: String,
          },
          degree: {
            type: String,
          },
          grade: {
            type: String,
            enum: getValues(grades, "code"),
          },
          gradeScore: {
            type: Number,
            es_indexed: true,
          },
          start: {
            type: Date,
          },
          end: {
            type: Date,
          },
          description: {
            type: String,
          },
        },
      ],
    },
    languages: [
      {
        type: String,
        enum: getValues(languages, "code"),
        es_indexed: true,
      },
    ],
    location: {
      type: {
        lat: Number,
        lon: Number,
      },
      es_indexed: true,
    },
    conversations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.CONVERSATION,
      },
    ],
    media: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: collections.MEDIA,
        },
      ],
      es_indexed: true,
    },
    saved_media: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.MEDIA,
      },
    ],
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.PROJECT,
        es_indexed: true,
      },
    ],
    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.PROFILE,
        es_indexed: true,
      },
    ],
    blocked_profiles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.PROFILE,
        es_indexed: true,
      },
    ],
    jobs_posted: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.JOB,
      },
    ],
    jobs_applied: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.APPLICATION,
      },
    ],
    email: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      maxlength: 13,
      minlength: 10,
    },
    password: {
      type: String,
      // required: true,
    },
    email_verified: {
      type: {
        verification_date: Date,
      },
      default: false,
    },
    mobile_verified: {
      type: {
        verification_date: Date,
      },
      default: false,
    },
    tc_accepted: {
      type: Boolean,
      default: false,
    },
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: collections.NOTIFICATION,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// // ES mapping
// profileSchema.plugin(mongoosastic, mapping);

const Profile = new mongoose.model(collections.PROFILE, profileSchema);

// Profile.createMapping((error) => {
//   if (error) {
//     console.error("Error when mapping profile documents: ", error);
//   }
// });

// let count = 0;
// Profile.synchronize()
//   .on("data", (err, doc) => {
//     count++;
//   })
//   .on("error", (error) => {
//     console.error("Error when indexing profile documents: ", error);
//   })
//   .on("close", () => {
//     console.info("Indexed " + count + " profile documents...");
//   });

module.exports = Profile;
