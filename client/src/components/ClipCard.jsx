import { useState } from "react";
import { downloadClip } from "../utils/api.js";
import "./ClipCard.css";

const EMOTION = {
  inspiring:     { emoji:"✨", color:"#FFD93D", bg:"rgba(255,217,61,0.12)" },
  funny:         { emoji:"😂", color:"#5CF6FF", bg:"rgba(92,246,255,0.12)" },
  shocking:      { emoji:"😱", color:"#FF5C7A", bg:"rgba(255,92,122,0.12)" },
  educational:   { emoji:"📚", color:"#5CF6A3", bg:"rgba(92,246,163,0.12)" },
  emotional:     { emoji:"💙", color:"#7C9CFF", bg:"rgba(124,156,255,0.12)" },
  motivational:  { emoji:"🔥", color:"#FF8C5A", bg:"rgba(255,140,90,0.12)" },
  controversial: { emoji:"⚡", color:"#C77DFF", bg:"rgba(199,125,255,0.12)" },
};
const PLATFORM = {
  tiktok:{ label:"TikTok",       emoji:"🎵" },
  reels: { label:"Reels",        emoji:"📸" },
  shorts:{ label:"Shorts",       emoji:"▶"  },
  all:   { label:"All Platforms",emoji:"🚀" },
};

function scoreColor(n) {
  return n >= 85 ? "#5CF6A3" : n >= 70 ? "#FFD93D" : "#FF8C5A";
}

// ─── inner: video preview ────────────────────────────────────────────────────
function ClipPreview({ clip, meta, settings, rank }) {
  const [playing, setPlaying] = useState(false);
  const startSec = clip.startSeconds;
  const orient   = settings.orientation === "portrait" ? "portrait"
                 : settings.orientation === "square"   ? "square" : "landscape";
  const ytSrc = `https://www.youtube.com/embed/${meta.id}?start=${startSec}&autoplay=1&rel=0&modestbranding=1&controls=1`;

  return (
    <div className={`clip-preview ${orient}`}>
      {playing ? (
        <iframe src={ytSrc} allow="autoplay; encrypted-media" allowFullScreen title={clip.title} />
      ) : (
        <>
          <img
            className="clip-thumb"
            src={meta.thumbnail}
            alt={clip.title}
            onClick={() => setPlaying(true)}
            onError={e => { e.target.src = meta.thumbnailMq; }}
          />
          <div className="clip-thumb-over" />
          <div className="clip-rank">#{rank}</div>
          <div className="clip-orient-badge">
            {settings.orientation === "portrait" ? "9:16"
           : settings.orientation === "square"   ? "1:1" : "16:9"}
          </div>
          <div className="clip-time-badge">⏱ {clip.startTime} → {clip.endTime}</div>
          <div className="clip-play-btn" onClick={() => setPlaying(true)}>▶</div>
          {settings.captions && clip.captions?.length > 0 && (
            <div className="clip-captions">
              {clip.captions.slice(0, 2).map((c, i) => (
                <div key={i} className="clip-cap-line">{c}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── main: clip card ─────────────────────────────────────────────────────────
export default function ClipCard({ clip, rank, meta, settings, onToast }) {
  const [open,    setOpen]    = useState(false);
  const [dlState, setDlState] = useState({ active: false, pct: 0, status: "" });

  const em = EMOTION[clip.emotionTag] || EMOTION.inspiring;
  const pl = PLATFORM[clip.platform]  || PLATFORM.all;
  const sc = scoreColor(clip.viralScore);

  const handleDownload = async () => {
    setDlState({ active: true, pct: 5, status: "Starting…" });
    try {
      const blob = await downloadClip(
        {
          url:          meta.url,
          startSeconds: clip.startSeconds,
          endSeconds:   clip.endSeconds,
          title:        clip.title,
        },
        (pct, status) => setDlState({ active: true, pct, status })
      );

      // Trigger browser download
      const blobUrl  = URL.createObjectURL(blob);
      const anchor   = document.createElement("a");
      const filename = `clipforge-${rank}-${clip.title.replace(/[^a-z0-9]/gi,"-").toLowerCase().slice(0,40)}.mp4`;
      anchor.href     = blobUrl;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(blobUrl);

      setDlState({ active: false, pct: 0, status: "" });
      onToast(`✅ Clip #${rank} downloaded!`, false);
    } catch (err) {
      console.error(err);
      setDlState({ active: false, pct: 0, status: "" });
      onToast(`❌ ${err.message}`, true);
    }
  };

  return (
    <div className="clip-card" style={{ animationDelay: `${(rank - 1) * 0.07}s` }}>

      {/* preview + download overlay */}
      <div className="clip-preview-wrap">
        <ClipPreview clip={clip} meta={meta} settings={settings} rank={rank} />

        {dlState.active && (
          <div className="dl-overlay">
            <span className="dl-icon">⚡</span>
            <div className="dl-title">Downloading clip…</div>
            <div className="dl-track">
              <div className="dl-fill" style={{ width: `${dlState.pct}%` }} />
            </div>
            <div className="dl-status">{dlState.status}</div>
            <div className="dl-pct">{dlState.pct}%</div>
          </div>
        )}
      </div>

      {/* body */}
      <div className="clip-body">
        <div className="clip-top">
          <h3 className="clip-title">{clip.title}</h3>
          <div className="viral-score">
            <div className="score-ring" style={{ borderColor: sc, color: sc }}>{clip.viralScore}</div>
            <span className="score-lbl">Viral</span>
          </div>
        </div>

        <p className="clip-hook">"{clip.hook}"</p>

        <div className="clip-meta">
          <span className="emotion-tag" style={{ color: em.color, background: em.bg, border: `1px solid ${em.color}40` }}>
            {em.emoji} {clip.emotionTag}
          </span>
          <span className="platform-tag">{pl.emoji} {pl.label}</span>
          <span className="platform-tag">⏱ {clip.duration}s</span>
        </div>

        {open && (
          <div className="clip-details">
            <p className="clip-summary">{clip.summary}</p>

            <div className="detail-section">
              <div className="detail-label">Captions</div>
              {clip.captions?.map((c, i) => (
                <div key={i} className="caption-item">{c}</div>
              ))}
            </div>

            {clip.ctaText && (
              <div className="detail-section">
                <div className="detail-label">Call to Action</div>
                <div className="cta-text">"{clip.ctaText}"</div>
              </div>
            )}
          </div>
        )}

        <div className="clip-tags">
          {clip.tags?.map((t, i) => <span key={i} className="clip-tag">{t}</span>)}
        </div>

        <div className="clip-actions">
          <button className="action-btn outline" onClick={() => setOpen(o => !o)}>
            {open ? "▲ Less" : "▼ Details"}
          </button>
          <button
            className="action-btn primary"
            onClick={handleDownload}
            disabled={dlState.active}
          >
            {dlState.active ? `⏳ ${dlState.pct}%` : "⬇ Download MP4"}
          </button>
        </div>
      </div>
    </div>
  );
}
