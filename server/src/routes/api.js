const express = require("express");
const { getInfo } = require("../controllers/infoController");
const { downloadClip } = require("../controllers/clipController");

const router = express.Router();

// GET /api/info?url=<youtube-url>
router.get("/info", getInfo);

// POST /api/clip  { url, startSeconds, endSeconds, title }
router.post("/clip", downloadClip);

// Health check
router.get("/health", (_, res) => res.json({ status: "ok" }));

module.exports = router;
