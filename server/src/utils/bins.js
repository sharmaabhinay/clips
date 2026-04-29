const { execSync } = require("child_process");
const path = require("path");

/**
 * Resolves the absolute path of a binary.
 * Checks well-known install locations first, then falls back to `which`.
 */
function resolveBin(name) {
  // Common install locations to check in order
  const candidates = {
    "yt-dlp": [
      "/usr/local/bin/yt-dlp",
      "/usr/bin/yt-dlp",
      path.join(process.env.HOME || "", ".local/bin/yt-dlp"),
      path.join(process.env.HOME || "", "Library/Python/3.11/bin/yt-dlp"),
      path.join(process.env.HOME || "", "Library/Python/3.12/bin/yt-dlp"),
      "yt-dlp", // last resort – rely on PATH
    ],
    ffmpeg: [
      "/usr/local/bin/ffmpeg",
      "/usr/bin/ffmpeg",
      "/opt/homebrew/bin/ffmpeg",
      "ffmpeg",
    ],
  };

  const fs = require("fs");
  const list = candidates[name] || [name];

  for (const candidate of list) {
    try {
      if (candidate.startsWith("/")) {
        if (fs.existsSync(candidate)) return candidate;
      } else {
        // relative name – try `which`
        const resolved = execSync(`which ${candidate} 2>/dev/null`).toString().trim();
        if (resolved) return resolved;
      }
    } catch (_) {}
  }

  // Final fallback: which on the exact name
  try {
    return execSync(`which ${name} 2>/dev/null`).toString().trim() || name;
  } catch (_) {
    return name;
  }
}

const YTDLP = resolveBin("yt-dlp");
const FFMPEG = resolveBin("ffmpeg");

console.log(`[bins] yt-dlp → ${YTDLP}`);
console.log(`[bins] ffmpeg  → ${FFMPEG}`);

module.exports = { YTDLP, FFMPEG };
