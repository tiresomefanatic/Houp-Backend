const router = require("express").Router();
const ChatController = require("../controllers/chat.controller");
const { AccessGuard } = require("../middlewares");

// Get all conversations of a profile
router.get("/convos/all/:id", AccessGuard(1), ChatController.getConversations);
// Get all conversations of a profile
router.get("/convos/:id", AccessGuard(13), ChatController.getConversation);
// Get all messages of a conversation of a profile
router.get("/messages/:id", AccessGuard(13), ChatController.getMessages);
// Add a new conversation to a profile
router.post("/convos/:id", AccessGuard(1), ChatController.addConversation);
// Update a conversation to a profile
router.put("/convos/", AccessGuard(14), ChatController.updateConversation);

module.exports = router;
