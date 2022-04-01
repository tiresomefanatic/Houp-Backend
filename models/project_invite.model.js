const mongoose = require("mongoose");
const { collections, professions } = require("../constants");
const { getValues } = require("../utils/common_utils");

const projectInviteSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: collections.PROJECT,
    required: true,
  },
  role: {
    type: String,
    enum: getValues(professions, "role"),
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  invited_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: collections.PROFILE,
    required: true,
  },
});

const ProjectInvite = new mongoose.model(
  collections.PROJECT_INVITE,
  projectInviteSchema
);

module.exports = ProjectInvite;
