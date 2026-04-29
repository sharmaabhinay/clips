import { useState } from "react";
import ClipCard from "./ClipCard.jsx";
import "./Results.css";

export default function Results({ clips, meta, settings, onRestart, onRegenerate }) {
  const [toast, setToast] = useState({ msg: "", error: false });

  const showToast = (msg, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast({ msg: "", error: false }), 3000);
  };

  const sorted = [...clips].sort((a, b) => b.viralScore - a.viralScore);
  const avg    = Math.round(clips.reduce((s, c) => s + c.viralScore, 0) / clips.length);
  const total  = clips.reduce((s, c) => s + c.duration, 0);

  return (
    <div className="results">
      <div className="results-header">
        <div>
          <h2 className="results-title">✨ {clips.length} Clips Ready</h2>
          <p className="results-sub">Click ▶ to preview · ⬇ Download MP4 to save · Sorted by viral score</p>
        </div>
        <div className="results-actions">
          <button className="btn btn-sec" onClick={onRegenerate}>↻ Regenerate</button>
          <button className="btn btn-sec" onClick={onRestart}>+ New Video</button>
        </div>
      </div>

      <div className="results-summary">
        {[
          ["Avg Score",      `${avg}/100`,    "#7C5CFF"],
          ["Best Clip",      `${sorted[0]?.viralScore}/100`, "#5CF6A3"],
          ["Total Duration", `${total}s`,     "#FF5CF6"],
          ["Format",         "Real MP4 files","#FFD93D"],
        ].map(([label, val, color]) => (
          <div key={label}>
            <div className="summary-label">{label}</div>
            <div className="summary-val" style={{ color }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="clips-grid">
        {sorted.map((clip, i) => (
          <ClipCard
            key={clip.id}
            clip={clip}
            rank={i + 1}
            meta={meta}
            settings={settings}
            onToast={showToast}
          />
        ))}
      </div>

      <div className={`toast ${toast.msg ? "show" : ""} ${toast.error ? "error" : ""}`}>
        {toast.msg}
      </div>
    </div>
  );
}
