import "./Hero.css";

export default function Hero() {
  return (
    <header className="hero">
      <div className="hero-badge">
        <span className="hero-dot" />
        AI-Powered · Real MP4 Downloads · Free
      </div>
      <h1>
        Turn any video into<br />
        <span className="hero-grad">viral clips</span>
      </h1>
      <p>
        Paste a YouTube link. AI finds the best moments —
        then download each clip as a real MP4 file instantly.
      </p>
      <div className="hero-stats">
        <div className="hero-stat">
          <div className="hero-stat-num">MP4</div>
          <div className="hero-stat-lbl">Real video files</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-num">AI</div>
          <div className="hero-stat-lbl">Clip scoring</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-num">1-click</div>
          <div className="hero-stat-lbl">Download</div>
        </div>
      </div>
    </header>
  );
}
