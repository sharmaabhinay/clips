import "./Analyzing.css";

export default function Analyzing({ progress, label, meta }) {
  return (
    <div className="an-wrap">
      <div className="an-card">
        <div className="an-rings">
          <div className="an-ring r1" />
          <div className="an-ring r2" />
          <div className="an-ring r3" />
        </div>
        <span className="an-bolt">⚡</span>
        <h2>AI is crafting your clips</h2>
        {meta && <p className="an-vid">"{meta.title}"</p>}
        <div className="an-prog-row">
          <div className="an-prog-track">
            <div className="an-prog-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="an-prog-pct">{progress}%</span>
        </div>
        <p className="an-label">{label}</p>
      </div>
    </div>
  );
}
