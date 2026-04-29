const { run } = require("../utils/run");
const { YTDLP } = require("../utils/bins");

/**
 * GET /api/info?url=<youtube-url>
 * Returns video metadata: id, title, channel, duration, thumbnail
 */
async function getInfo(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing ?url= parameter" });
  }

  try {
    const json = await run(YTDLP, [
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      // YouTube authentication bypass
      "--extractor-args", "youtube:player_client=web",
      "--extractor-args", "youtube:player_skip=js",
      url,
    ]);

    const info = JSON.parse(json);

    res.json({
      id:        info.id,
      title:     info.title,
      channel:   info.uploader || info.channel || "Unknown",
      duration:  info.duration,          // seconds (number)
      thumbnail: info.thumbnail,
    });
  } catch (err) {
    console.error("[info] error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getInfo };
