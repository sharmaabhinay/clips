const BASE = import.meta.env.VITE_API_BASE || "/api";

/**
 * Fetch video metadata from the backend (which uses yt-dlp).
 * Falls back to noembed if the server call fails.
 */
export async function fetchVideoInfo(url) {
  try {
    const res = await fetch(`${BASE}/info?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error("server error");
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return {
      id:           data.id,
      title:        data.title,
      channel:      data.channel,
      durationSecs: data.duration,
      thumbnail:    `https://img.youtube.com/vi/${data.id}/maxresdefault.jpg`,
      thumbnailMq:  `https://img.youtube.com/vi/${data.id}/mqdefault.jpg`,
      url,
    };
  } catch (_) {
    // Fallback: noembed (no duration)
    const id  = extractVideoId(url);
    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
    const d   = await res.json();
    return {
      id,
      title:        d.title        || "YouTube Video",
      channel:      d.author_name  || "Unknown",
      durationSecs: null,
      thumbnail:    `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      thumbnailMq:  `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
      url,
    };
  }
}

/**
 * Download a clip from the backend as a binary MP4 blob.
 * Calls onProgress(pct 0-100, statusText) as data arrives.
 */
export async function downloadClip({ url, startSeconds, endSeconds, title }, onProgress) {
  onProgress(5, "Connecting to server…");

  const res = await fetch(`${BASE}/clip`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ url, startSeconds, endSeconds, title }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Server error" }));
    throw new Error(err.error || `Server responded ${res.status}`);
  }

  onProgress(20, "Downloading video segment…");

  const contentLength = Number(res.headers.get("Content-Length") || 0);
  const reader  = res.body.getReader();
  const chunks  = [];
  let received  = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (contentLength > 0) {
      const pct = Math.round(20 + (received / contentLength) * 70);
      onProgress(Math.min(pct, 90), "Downloading…");
    }
  }

  onProgress(95, "Saving file…");
  return new Blob(chunks, { type: "video/mp4" });
}

// ─── helpers ────────────────────────────────────────────────────────────────

export function extractVideoId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function isValidYouTubeUrl(url) {
  return !!extractVideoId(url);
}

export function timeToSeconds(t) {
  if (!t) return 0;
  const p = t.split(":").map(Number);
  return p.length === 2 ? p[0] * 60 + p[1] : p[0] * 3600 + p[1] * 60 + p[2];
}
