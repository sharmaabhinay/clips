import "./Settings.css";

function Pill({ val, cur, onSelect, label, variant }) {
  const active = cur === val;
  return (
    <button
      className={`pill ${active ? (variant === "pink" ? "active-pink" : "active") : ""}`}
      onClick={() => onSelect(val)}
    >
      {label}
    </button>
  );
}

function Toggle({ label, desc, val, onToggle }) {
  return (
    <div className="toggle-wrap" onClick={onToggle}>
      <div>
        <div className="toggle-title">{label}</div>
        <div className="toggle-desc">{desc}</div>
      </div>
      <div className={`toggle ${val ? "on" : ""}`} />
    </div>
  );
}

export default function Settings({ meta, settings, onChange, onGenerate, onBack }) {
  const s = settings;
  const u = (key, val) => onChange({ ...s, [key]: val });

  return (
    <div className="card">
      <div className="settings-head">
        <button className="btn btn-sec settings-back" onClick={onBack}>← Back</button>
        <div>
          <div className="settings-title">Clip Settings</div>
          {meta && <div className="settings-video">{meta.title}</div>}
        </div>
      </div>

      <div className="settings-grid">

        <div className="setting-group">
          <div className="setting-label">⏱ Clip Duration</div>
          <div className="pills">
            {[["15-30","15–30s"],["30-60","30–60s"],["60-90","60–90s"],["custom","Auto"]].map(([v,l]) => (
              <Pill key={v} val={v} cur={s.duration} onSelect={v => u("duration",v)} label={l} />
            ))}
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">🎬 Number of Clips</div>
          <div className="stepper">
            <button className="stepper-btn" onClick={() => u("numClips", Math.max(1, s.numClips - 1))}>−</button>
            <span className="stepper-num">{s.numClips}</span>
            <button className="stepper-btn" onClick={() => u("numClips", Math.min(8, s.numClips + 1))}>+</button>
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">📱 Orientation</div>
          <div className="pills">
            {[["portrait","📱 Portrait (9:16)"],["landscape","🖥 Landscape (16:9)"],["square","⬛ Square (1:1)"]].map(([v,l]) => (
              <Pill key={v} val={v} cur={s.orientation} onSelect={v => u("orientation",v)} label={l} />
            ))}
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">🎯 Focus Mode</div>
          <div className="pills">
            {[["highlights","🔥 Highlights"],["educational","📚 Educational"],["emotional","💙 Emotional"],["funny","😂 Funny"],["controversial","⚡ Controversial"]].map(([v,l]) => (
              <Pill key={v} val={v} cur={s.focus} onSelect={v => u("focus",v)} label={l} />
            ))}
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">💬 Caption Style</div>
          <div className="pills">
            {[["bold-bottom","Bold Bottom"],["top-center","Top Center"],["karaoke","Karaoke"],["outline","Outline"],["neon","Neon"]].map(([v,l]) => (
              <button
                key={v}
                className={`pill ${s.captionStyle === v ? "active-pink" : ""}`}
                onClick={() => u("captionStyle",v)}
                style={{ opacity: s.captions ? 1 : 0.4 }}
              >{l}</button>
            ))}
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">🎥 Export Quality</div>
          <div className="pills">
            {["720p","1080p","4K"].map(q => (
              <Pill key={q} val={q} cur={s.quality} onSelect={v => u("quality",v)} label={q} />
            ))}
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">🌐 Caption Language</div>
          <div className="pills">
            {[["en","English"],["es","Español"],["fr","Français"],["de","Deutsch"],["pt","Português"],["hi","Hindi"]].map(([v,l]) => (
              <Pill key={v} val={v} cur={s.language} onSelect={v => u("language",v)} label={l} />
            ))}
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">🚀 Target Platform</div>
          <div className="pills">
            {[["tiktok","TikTok"],["reels","Reels"],["shorts","Shorts"],["all","All Platforms"]].map(([v,l]) => (
              <Pill key={v} val={v} cur={s.platform} onSelect={v => u("platform",v)} label={l} />
            ))}
          </div>
        </div>

        <div className="setting-group setting-full">
          <div className="setting-label">⚙️ Options</div>
          <div className="toggles-grid">
            <Toggle label="Auto Captions"    desc="AI-generated subtitles"   val={s.captions}   onToggle={() => u("captions",   !s.captions)} />
            <Toggle label="Background Music" desc="Subtle ambient music"      val={s.bgMusic}    onToggle={() => u("bgMusic",    !s.bgMusic)} />
            <Toggle label="Auto Color Grade" desc="Enhance colors"            val={s.autoColor}  onToggle={() => u("autoColor",  !s.autoColor)} />
            <Toggle label="Watermark"        desc="Brand clips with handle"   val={s.watermark}  onToggle={() => u("watermark",  !s.watermark)} />
          </div>
        </div>

      </div>

      <div className="settings-footer">
        <button className="gen-btn" onClick={onGenerate}>
          ⚡ Generate {s.numClips} Clip{s.numClips !== 1 ? "s" : ""} with AI
        </button>
        <p className="settings-hint">
          AI picks the best {s.numClips} moment{s.numClips !== 1 ? "s" : ""} · {s.duration}s · {s.orientation} · {s.focus}
        </p>
      </div>
    </div>
  );
}
