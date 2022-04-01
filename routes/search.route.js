const router = require("express").Router();
const SearchController = require("../controllers/search.controller");

// Search Profiles, Projects & Jobs
router.put("/", SearchController.search);

// Search Profiles
router.put("/profiles", SearchController.searchProfiles);

// Search Projects
router.put("/projects", SearchController.searchProjects);

// Search Jobs
router.put("/jobs", SearchController.searchJobs);

module.exports = router;
