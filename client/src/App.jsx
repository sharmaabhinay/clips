import { useState } from "react";
import Hero      from "./components/Hero.jsx";
import UrlInput  from "./components/UrlInput.jsx";
import Settings  from "./components/Settings.jsx";
import Analyzing from "./components/Analyzing.jsx";
import Results   from "./components/Results.jsx";
import { generateClipsWithAI, generateFallbackClips, normaliseClips } from "./utils/clips.js";
import "./styles/global.css";

const STEP = { INPUT: 0, SETTINGS: 1, ANALYZING: 2, RESULTS: 3 };

const DEFAULT_SETTINGS = {
  duration:     "30-60",
  orientation:  "portrait",
  captions:     true,
  captionStyle: "bold-bottom",
  numClips:     3,
  language:     "en",
  focus:        "highlights",
  bgMusic:      false,
  autoColor:    true,
  quality:      "1080p",
  watermark:    false,
  platform:     "all",
};

export default function App() {
  const [step,     setStep]     = useState(STEP.INPUT);
  const [meta,     setMeta]     = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [clips,    setClips]    = useState([]);
  const [progress, setProgress] = useState(0);
  const [label,    setLabel]    = useState("");

  // ── animation helper ────────────────────────────────────────────────────────
  const sleep   = ms => new Promise(r => setTimeout(r, ms));
  const animTo  = target => new Promise(res => {
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= target) { clearInterval(iv); res(); return target; }
        return Math.min(p + 2, target);
      });
    }, 25);
  });

  // ── generate clips ──────────────────────────────────────────────────────────
  const generate = async () => {
    setStep(STEP.ANALYZING);
    setProgress(0);

    setLabel("Fetching video info…");            await animTo(15); await sleep(300);
    setLabel("Analysing key moments with AI…");

    let raw = null;
    try   { raw = await generateClipsWithAI(meta, settings); }
    catch (e) { console.warn("AI call failed, using fallback:", e.message); }

    await animTo(70);
    setLabel("Scoring clips by engagement…");    await sleep(400); await animTo(85);
    setLabel("Generating captions & tags…");     await sleep(350); await animTo(95);

    // Parse AI output or use fallback
    let generated = raw ?? generateFallbackClips(settings, meta);

    // Trim / pad to requested count
    generated = generated.slice(0, settings.numClips);
    while (generated.length < settings.numClips) {
      const extra = generateFallbackClips({ ...settings, numClips: 1 }, meta)[0];
      extra.id = `clip-${generated.length + 1}`;
      generated.push(extra);
    }

    generated = normaliseClips(generated);

    setLabel("Done!");
    setClips(generated);
    await animTo(100);
    await sleep(300);
    setStep(STEP.RESULTS);
  };

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleUrlSubmit = (url, videoMeta) => {
    setMeta(videoMeta);
    setStep(STEP.SETTINGS);
  };

  const handleRestart = () => {
    setStep(STEP.INPUT);
    setClips([]);
    setMeta(null);
  };

  return (
    <div className="app">
      <div className="mesh" />
      <div className="noise" />

      <Hero />

      <main>
        {step === STEP.INPUT && (
          <UrlInput onSubmit={handleUrlSubmit} />
        )}

        {step === STEP.SETTINGS && (
          <Settings
            meta={meta}
            settings={settings}
            onChange={setSettings}
            onGenerate={generate}
            onBack={() => setStep(STEP.INPUT)}
          />
        )}

        {step === STEP.ANALYZING && (
          <Analyzing progress={progress} label={label} meta={meta} />
        )}

        {step === STEP.RESULTS && (
          <Results
            clips={clips}
            meta={meta}
            settings={settings}
            onRestart={handleRestart}
            onRegenerate={generate}
          />
        )}
      </main>
    </div>
  );
}
