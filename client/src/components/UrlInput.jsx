import { useState } from "react";
import { fetchVideoInfo, isValidYouTubeUrl, extractVideoId } from "../utils/api.js";
import "./UrlInput.css";

export default function UrlInput({ onSubmit }) {
  const [url,     setUrl]     = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [meta,    setMeta]    = useState(null);

  const tryFetch = async (val) => {
    setUrl(val); setError(""); setMeta(null);
    if (!isValidYouTubeUrl(val)) return;
    setLoading(true);
    try   { setMeta(await fetchVideoInfo(val)); }
    catch {
      const id = extractVideoId(val);
      setMeta({ id, title: "YouTube Video", channel: "Unknown", durationSecs: null,
        thumbnail:   `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
        thumbnailMq: `https://img.youtube.com/vi/${id}/mqdefault.jpg`, url: val });
    }
    finally { setLoading(false); }
  };

  const paste = async () => {
    try   { const t = await navigator.clipboard.readText(); tryFetch(t); }
    catch { setError("Couldn't read clipboard — paste manually."); }
  };

  const go = () => {
    if (!url.trim())             return setError("Please enter a YouTube URL.");
    if (!isValidYouTubeUrl(url)) return setError("That doesn't look like a valid YouTube URL.");
    onSubmit(url, meta);
  };

  return (
    <div className="card">
      <h2 className="url-title">Paste your YouTube video</h2>
      <p  className="url-sub">Works with interviews, podcasts, tutorials, vlogs, lectures…</p>

      <div className="url-row">
        <span className="url-icon">▶</span>
        <input
          className="url-input"
          placeholder="https://www.youtube.com/watch?v=…"
          value={url}
          onChange={e => tryFetch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && go()}
        />
        <button className="btn btn-sec" onClick={paste}>📋 Paste</button>
        <button className="btn btn-pri" onClick={go} disabled={!meta || loading}>
          {loading ? "Checking…" : "Analyse →"}
        </button>
      </div>

      {error   && <p className="url-err">⚠ {error}</p>}
      {loading && <p className="url-loading">⏳ Fetching video info…</p>}

      {meta && !loading && (
        <div className="url-preview">
          <img src={meta.thumbnailMq} alt="" className="url-thumb"
            onError={e => e.target.style.display = "none"} />
          <div className="url-preview-info">
            <div className="url-preview-title">{meta.title}</div>
            <div className="url-preview-meta">
              📺 {meta.channel}
              {meta.durationSecs ? ` · ${Math.round(meta.durationSecs / 60)}m` : ""}
            </div>
          </div>
          <span className="url-ok">✓</span>
        </div>
      )}

      <div className="url-chips">
        {["Interview","Podcast","Tutorial","Vlog","Speech","Lecture"].map(t => (
          <span key={t} className="url-chip">✓ {t}</span>
        ))}
      </div>
    </div>
  );
}
