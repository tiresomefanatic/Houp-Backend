const mongoose = require("mongoose");
// const mongoosastic = require("mongoosastic");
// const mapping = require("./es_mappings/cast_roles.mapping");
const { professions, collections, deptSections } = require("../constants");
const { getValues } = require("../utils/common_utils");

const castRoleSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.JOB,
      required: true,
      es_indexed: true,
    },
    role: {
      type: String,
      enum: getValues(professions, "role", { section: deptSections.CAST }),
      required: true,
      es_indexed: true,
    },
    payment: {
      type: Number,
      default: null,
      es_indexed: true,
    },
    description: {
      type: String,
      es_indexed: true,
    },
  },
  {
    timestamps: true,
  }
);

// // ES mapping
// castRoleSchema.plugin(mongoosastic, mapping);

const CastRole = new mongoose.model(collections.CAST_ROLE, castRoleSchema);

// CastRole.createMapping((error) => {
//   if (error) {
//     console.error("Error when mapping cast role documents: ", error);
//   }
// });

// let count = 0;
// CastRole.synchronize()
//   .on("data", (err, doc) => {
//     count++;
//   })
//   .on("error", (error) => {
//     console.error("Error when indexing cast role documents: ", error);
//   })
//   .on("close", () => {
//     console.info("Indexed " + count + " cast role documents...");
//   });

module.exports = CastRole;
