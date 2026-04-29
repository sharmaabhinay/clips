const { spawn } = require("child_process");

/**
 * Runs a command and returns stdout as a string.
 * Rejects with a detailed error if the process exits non-zero.
 */
function run(bin, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, {
      ...opts,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));

    proc.on("error", (err) => {
      if (err.code === "ENOENT") {
        reject(
          new Error(
            `Binary not found: "${bin}". ` +
              `Make sure yt-dlp and ffmpeg are installed and on your PATH.\n` +
              `  macOS:  brew install yt-dlp ffmpeg\n` +
              `  Ubuntu: sudo apt install ffmpeg && pip install yt-dlp\n` +
              `  Win:    pip install yt-dlp  +  install ffmpeg and add to PATH`
          )
        );
      } else {
        reject(err);
      }
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr.trim() || `Process exited with code ${code}`));
      }
    });
  });
}

module.exports = { run };
