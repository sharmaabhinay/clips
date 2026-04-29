const path = require("path");
const fs = require("fs");
const os = require("os");
const { run } = require("../utils/run");
const { YTDLP, FFMPEG } = require("../utils/bins");

const TMP_DIR = path.join(os.tmpdir(), "clipforge");

// Ensure temp directory exists
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

/**
 * POST /api/clip
 * Body: { url, startSeconds, endSeconds, title }
 *
 * Downloads only the requested segment via yt-dlp --download-sections,
 * then streams the resulting MP4 back to the client.
 */
async function downloadClip(req, res) {
  const { url, startSeconds, endSeconds, title = "clip" } = req.body;

  if (!url || startSeconds == null || endSeconds == null) {
    return res.status(400).json({
      error: "Request body must include: url, startSeconds, endSeconds",
    });
  }

  const start  = Math.max(0, Math.floor(startSeconds));
  const end    = Math.ceil(endSeconds);
  const dur    = end - start;

  if (dur <= 0) {
    return res.status(400).json({ error: "endSeconds must be greater than startSeconds" });
  }

  const safeTitle = title
    .replace(/[^a-z0-9\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 50);

  const stamp   = Date.now();
  const rawPath = path.join(TMP_DIR, `raw-${stamp}.mp4`);
  const outPath = path.join(TMP_DIR, `clip-${stamp}-${safeTitle}.mp4`);

  try {
    // ─── Step 1: download only the needed section ────────────────────────
    console.log(`[clip] downloading ${url}  [${start}s → ${end}s]`);

    await run(YTDLP, [
      url,
      "--no-playlist",
      "--no-warnings",
      // YouTube authentication bypass
      "--extractor-args", "youtube:player_client=web",
      "--extractor-args", "youtube:player_skip=js",
      // Best quality that results in a single MP4 (no separate audio merge needed)
      "--format",
      "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      // Download only this timestamp range
      "--download-sections", `*${start}-${end}`,
      "--force-keyframes-at-cuts",
      "--merge-output-format", "mp4",
      // Pass ffmpeg location so yt-dlp can find it
      "--ffmpeg-location", path.dirname(FFMPEG),
      "-o", rawPath,
    ]);

    // yt-dlp sometimes writes .mp4 directly, sometimes appends nothing
    const actualRaw = fs.existsSync(rawPath)
      ? rawPath
      : (() => {
          // find the file it did create
          const files = fs.readdirSync(TMP_DIR)
            .filter((f) => f.startsWith(`raw-${stamp}`))
            .map((f) => path.join(TMP_DIR, f));
          return files[0] || null;
        })();

    if (!actualRaw || !fs.existsSync(actualRaw)) {
      throw new Error("yt-dlp did not produce an output file. The video may be restricted or unavailable.");
    }

    // ─── Step 2: re-trim with ffmpeg for frame-accurate cut ─────────────
    console.log(`[clip] trimming with ffmpeg → ${outPath}`);

    await run(FFMPEG, [
      "-y",
      "-i",  actualRaw,
      "-ss", "0",
      "-t",  String(dur),
      "-c",  "copy",          // stream copy – fast, no re-encode
      outPath,
    ]);

    // Cleanup raw download
    fs.unlink(actualRaw, () => {});

    if (!fs.existsSync(outPath)) {
      throw new Error("ffmpeg did not produce a trimmed output file.");
    }

    // ─── Step 3: stream MP4 to client ───────────────────────────────────
    const stat = fs.statSync(outPath);
    const filename = `clipforge-${safeTitle}.mp4`;

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Length", stat.size);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Length");

    const stream = fs.createReadStream(outPath);
    stream.pipe(res);
    stream.on("close", () => fs.unlink(outPath, () => {}));
    stream.on("error", (err) => {
      console.error("[clip] stream error:", err.message);
      if (!res.headersSent) res.status(500).json({ error: err.message });
    });
  } catch (err) {
    // Cleanup on error
    [rawPath, outPath].forEach((f) => { if (fs.existsSync(f)) fs.unlink(f, () => {}); });

    console.error("[clip] error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { downloadClip };
