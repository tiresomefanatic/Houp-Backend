const mongoose = require("mongoose");
// const mongoosastic = require("mongoosastic");
// const mapping = require("./es_mappings/crew_roles.mapping");
const { professions, collections, deptSections } = require("../constants");
const { getValues } = require("../utils/common_utils");

const crewRoleSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: collections.JOB,
      required: true,
      es_indexed: true,
    },
    role: {
      type: String,
      enum: getValues(professions, "role", { section: deptSections.CREW }),
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
// crewRoleSchema.plugin(mongoosastic, mapping);

const CrewRole = new mongoose.model(collections.CREW_ROLE, crewRoleSchema);

// CrewRole.createMapping((error) => {
//   if (error) {
//     console.error("Error when mapping crew role documents: ", error);
//   }
// });

// let count = 0;
// CrewRole.synchronize()
//   .on("data", (err, doc) => {
//     count++;
//   })
//   .on("error", (error) => {
//     console.error("Error when indexing crew role documents: ", error);
//   })
//   .on("close", () => {
//     console.info("Indexed " + count + " crew role documents...");
//   });

module.exports = CrewRole;
