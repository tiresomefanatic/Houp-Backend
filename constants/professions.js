const departments = require("./departments");
const deptSections = require("./dept_sections");

module.exports = {
  CINEMATOGRAPHER: {
    role: "CINEMATOGRAPHER",
    department: departments.CAMERA,
    section: deptSections.CREW,
  },
  CAMERA_ASSISTANT: {
    role: "CAMERA_ASSISTANT",
    department: departments.CAMERA,
    section: deptSections.CREW,
  },
  PHOTOGRAPHER: {
    role: "PHOTOGRAPHER",
    department: departments.CAMERA,
    section: deptSections.CREW,
  },
  LOADER: {
    role: "LOADER",
    department: departments.CAMERA,
    section: deptSections.CREW,
  },
  DOP: {
    role: "DIRECTOR_OF_PHOTOGRAPHY",
    department: departments.CAMERA,
    section: deptSections.CREW,
  },
  STEADY_CAM_OPERATOR: {
    role: "STEADY_CAM_OPERATOR",
    department: departments.CAMERA,
    section: deptSections.CREW,
  },
  DIT: {
    role: "DIGITAL_IMAGE_TECHNICIAN",
    department: departments.CAMERA,
    section: deptSections.CREW,
  },
  DIRECTOR: {
    role: "DIRECTOR",
    department: departments.DIRECTION,
    section: deptSections.CREW,
  },
  ASSISTANT_DIRECTOR: {
    role: "ASSISTANT_DIRECTOR",
    department: departments.DIRECTION,
    section: deptSections.CREW,
  },
  SET_DIRECTOR: {
    role: "SET_DIRECTOR",
    department: departments.DIRECTION,
    section: deptSections.CREW,
  },
  SCREEN_PLAY_DIRECTOR: {
    role: "SCREEN_PLAY_DIRECTOR",
    department: departments.DIRECTION,
    section: deptSections.CREW,
  },
  PRODUCER: {
    role: "PRODUCER",
    department: departments.PRODUCTION,
    section: deptSections.CREW,
  },
  ASSISTANT_PRODUCER: {
    role: "ASSISTANT_PRODUCER",
    department: departments.PRODUCTION,
    section: deptSections.CREW,
  },
  PRODUCTION_SECRETARY: {
    role: "PRODUCTION_SECRETARY",
    department: departments.PRODUCTION,
    section: deptSections.CREW,
  },
  UNIT_PRODUCTION_MANAGER: {
    role: "UNIT_PRODUCTION_MANAGER",
    department: departments.PRODUCTION,
    section: deptSections.CREW,
  },
  LINE_PRODUCER: {
    role: "LINE_PRODUCER",
    department: departments.PRODUCTION,
    section: deptSections.CREW,
  },
  PRODUCTION_COORDINATOR: {
    role: "PRODUCTION_COORDINATOR",
    department: departments.PRODUCTION,
    section: deptSections.CREW,
  },
  OFFICE_PAS: {
    role: "OFFICE_PA'S",
    department: departments.PRODUCTION,
    section: deptSections.CREW,
  },
  PROP_MAKER: {
    role: "PROP_MAKER",
    department: departments.ART,
    section: deptSections.CREW,
  },
  ASSISTANT_ART_DIRECTOR: {
    role: "ASSISTANT_ART_DIRECTOR",
    department: departments.ART,
    section: deptSections.CREW,
  },
  SET_DECORATORS: {
    role: "SET_DECORATORS",
    department: departments.ART,
    section: deptSections.CREW,
  },
  KEY_SCENIC: {
    role: "KEY_SCENIC",
    department: departments.ART,
    section: deptSections.CREW,
  },
  CONSTRUCTION_COORDINATOR: {
    role: "CONSTRUCTION_COORDINATOR",
    department: departments.ART,
    section: deptSections.CREW,
  },
  PRODUCTION_DESIGNER: {
    role: "PRODUCTION_DESIGNER",
    department: departments.ART,
    section: deptSections.CREW,
  },
  ART_DIRECTOR: {
    role: "ART_DIRECTOR",
    department: departments.ART,
    section: deptSections.CREW,
  },
  CARPENTERS: {
    role: "CARPENTERS",
    department: departments.ART,
    section: deptSections.CREW,
  },
  SCENIC_ARTISTS: {
    role: "SCENIC_ARTISTS",
    department: departments.ART,
    section: deptSections.CREW,
  },
  SET_DRESSERS: {
    role: "SET_DRESSERS",
    department: departments.ART,
    section: deptSections.CREW,
  },
  PROP_MASTER: {
    role: "PROP_MASTER",
    department: departments.ART,
    section: deptSections.CREW,
  },
  PROP_ASSISTANT: {
    role: "PROP_ASSISTANT",
    department: departments.ART,
    section: deptSections.CREW,
  },
  KEY_HAIR_ARTIST: {
    role: "KEY_HAIR_ARTIST",
    department: departments.HAIR_AND_MAKEUP,
    section: deptSections.CREW,
  },
  MAKE_UP_ARTIST: {
    role: "MAKE_UP_ARTIST",
    department: departments.HAIR_AND_MAKEUP,
    section: deptSections.CREW,
  },
  SPECIAL_EFFECTS_TO_HAIR_AND_MAKEUP: {
    role: "SPECIAL_EFFECTS_TO_HAIR_AND_MAKEUP",
    department: departments.HAIR_AND_MAKEUP,
    section: deptSections.CREW,
  },
  STUNT_COORDINATOR: {
    role: "STUNT_COORDINATOR",
    department: departments.STUNT,
    section: deptSections.CREW,
  },
  STUNT_PERFORMER: {
    role: "STUNT_PERFORMER",
    department: departments.STUNT,
    section: deptSections.CREW,
  },
  ACTOR: {
    role: "ACTOR",
    department: departments.ACTING,
    section: deptSections.CAST,
  },
  LEAD_ROLE: {
    role: "LEAD_ROLE",
    department: departments.ACTING,
    section: deptSections.CAST,
  },
  SUPPORTING_ROLE: {
    role: "SUPPORTING_ROLE",
    department: departments.ACTING,
    section: deptSections.CAST,
  },
  COMEDIAN: {
    role: "COMEDIAN",
    department: departments.ACTING,
    section: deptSections.CAST,
  },
  DAY_PLAYER: {
    role: "DAY_PLAYER",
    department: departments.ACTING,
    section: deptSections.CAST,
  },
  THEATRE_ARTIST: {
    role: "THEATRE_ARTIST",
    department: departments.ACTING,
    section: deptSections.CAST,
  },
  JUNIOR_ARTIST: {
    role: "JUNIOR_ARTIST",
    department: departments.ACTING,
    section: deptSections.CAST,
  },
  NEGATIVE_ROLE: {
    role: "NEGATIVE_ROLE",
    department: departments.ACTING,
    section: deptSections.CAST,
  },
  DIALOG_WRITER: {
    role: "DIALOG_WRITER",
    department: departments.WRITING,
    section: deptSections.CREW,
  },
  WRITER: {
    role: "WRITER",
    department: departments.WRITING,
    section: deptSections.CREW,
  },
  SCREENPLAY_WRITER: {
    role: "SCREENPLAY_WRITER",
    department: departments.WRITING,
    section: deptSections.CREW,
  },
  FOLEY_ARTIST: {
    role: "FOLEY_ARTIST",
    department: departments.MUSIC_AND_SOUND,
    section: deptSections.CREW,
  },
  LYRICIST: {
    role: "LYRICIST",
    department: departments.MUSIC_AND_SOUND,
    section: deptSections.CREW,
  },
  BOOM_OPERATOR: {
    role: "BOOM_OPERATOR",
    department: departments.MUSIC_AND_SOUND,
    section: deptSections.CREW,
  },
  PRODUCTION_SOUND_MIXER: {
    role: "PRODUCTION_SOUND_MIXER",
    department: departments.MUSIC_AND_SOUND,
    section: deptSections.CREW,
  },
  SOUND_DESIGNER: {
    role: "SOUND_DESIGNER",
    department: departments.MUSIC_AND_SOUND,
    section: deptSections.CREW,
  },
  MUSIC_DIRECTOR: {
    role: "MUSIC_DIRECTOR",
    department: departments.MUSIC_AND_SOUND,
    section: deptSections.CREW,
  },
  ASSISTANT_TO_MUSIC_DIRECTOR: {
    role: "ASSISTANT_TO_MUSIC_DIRECTOR",
    department: departments.MUSIC_AND_SOUND,
    section: deptSections.CREW,
  },
  COMPOSER: {
    role: "COMPOSER",
    department: departments.MUSIC_AND_SOUND,
    section: deptSections.CREW,
  },
  SINGER: {
    role: "SINGER",
    department: departments.MUSIC_AND_SOUND,
    section: deptSections.CREW,
  },
  SFX: {
    role: "SFX",
    department: departments.MUSIC_AND_SOUND,
    section: deptSections.CREW,
  },
  SEAM_STRESS: {
    role: "SEAM_STRESS",
    department: departments.COSTUME,
    section: deptSections.CREW,
  },
  WARDROBE_DESIGNER: {
    role: "WARDROBE_DESIGNER",
    department: departments.COSTUME,
    section: deptSections.CREW,
  },
  COSTUME_DESIGNER: {
    role: "COSTUME_DESIGNER",
    department: departments.COSTUME,
    section: deptSections.CREW,
  },
  SHOPPERS: {
    role: "SHOPPERS",
    department: departments.COSTUME,
    section: deptSections.CREW,
  },
  SET_CUSTOMERS: {
    role: "SET_CUSTOMERS",
    department: departments.COSTUME,
    section: deptSections.CREW,
  },
  EDITOR: {
    role: "EDITOR",
    department: departments.VFX_SFX,
    section: deptSections.CREW,
  },
  VFX_TECHNICIAN: {
    role: "VFX_TECHNICIAN",
    department: departments.VFX_SFX,
    section: deptSections.CREW,
  },
  VFX_SUPERVISOR: {
    role: "VFX_SUPERVISOR",
    department: departments.VFX_SFX,
    section: deptSections.CREW,
  },
  SFX_TECHNICIAN: {
    role: "SFX_TECHNICIAN",
    department: departments.VFX_SFX,
    section: deptSections.CREW,
  },
  SFX_SUPERVISOR: {
    role: "SFX_SUPERVISOR",
    department: departments.VFX_SFX,
    section: deptSections.CREW,
  },
};
