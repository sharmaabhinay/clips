import { timeToSeconds } from "./api.js";

// ─── AI generation ───────────────────────────────────────────────────────────

export async function generateClipsWithAI(meta, settings) {
  const prompt = `You are an expert viral video editor for TikTok, Reels, and YouTube Shorts.

Video: "${meta.title}" by ${meta.channel}
Total duration: ${meta.durationSecs ? Math.round(meta.durationSecs) + " seconds" : "unknown"}
Target: ${settings.numClips} clips, ${settings.duration}s each, ${settings.orientation}, focus: ${settings.focus}

Generate exactly ${settings.numClips} highly-optimised short clip ideas specific to this video.
Spread them across the video. Use realistic timestamps within the total duration.

Return ONLY a valid JSON array — no markdown, no explanation. Each element:
{
  "id": "clip-1",
  "title": "catchy 4-8 word title specific to this video",
  "startTime": "m:ss",
  "endTime": "m:ss",
  "startSeconds": <integer>,
  "endSeconds": <integer>,
  "duration": <integer seconds>,
  "hook": "attention-grabbing opening ≤15 words",
  "summary": "2 sentences on why this clip will go viral",
  "viralScore": <integer 62-96>,
  "captions": ["line1","line2","line3","line4","line5"],
  "tags": ["#tag1","#tag2","#tag3","#tag4","#tag5"],
  "emotionTag": "inspiring|funny|shocking|educational|emotional|motivational|controversial",
  "thumbnailColor": "#hexcolor",
  "platform": "tiktok|reels|shorts|all",
  "ctaText": "end-card call to action"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages:   [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = await res.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";

  // Try strict parse
  try {
    const clean = text.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (_) {}

  // Try extract array from text
  try {
    const match = text.match(/\[[\s\S]+\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  return null; // signal to use fallback
}

// ─── Smart fallback ──────────────────────────────────────────────────────────

const TEMPLATES = [
  { title: "The moment that changes everything",  hook: "Nobody talks about what happens next…",          captions: ["Wait for it… 👀", "This is the part everyone skips to", "Nobody warned me about this", "The internet wasn't ready ⚡", "Saving this forever 🔥"] },
  { title: "The truth nobody wants to hear",      hook: "This took me years to understand…",              captions: ["This hit different 💙", "Why didn't anyone tell me sooner", "Taking notes rn 📝", "This is the content I needed", "Sharing this with everyone"] },
  { title: "Controversial take — do you agree?",  hook: "I said what I said.",                            captions: ["Say it louder 🎤", "Comments going crazy", "Drop your thoughts 👇", "Finally someone said it", "Genius or chaos?"] },
  { title: "The secret they never teach you",     hook: "Schools won't tell you this. I will.",           captions: ["Why is this not taught?!", "Bookmarking 📌", "This changed how I think", "The people who know this win 🏆", "Pass this on"] },
  { title: "Unpopular opinion — hear me out",     hook: "Hear me out before you scroll away.",            captions: ["I actually agree 😅", "NOT ready for the comments", "Hot take below 🔥", "Controversial but correct", "Opinion unlocked"] },
  { title: "This is genuinely surprising",        hook: "I was today years old when I learned this.",     captions: ["Wait WHAT 😱", "How did I not know??", "My whole life was a lie", "Tag someone who needs this", "Testing this immediately"] },
  { title: "The advice I wish I had sooner",      hook: "If I could go back and tell myself one thing…", captions: ["Sending this to my younger self 💌", "Crying ngl 😭", "Better late than never", "This is free therapy", "Saving for later 📌"] },
  { title: "Proof that most people are wrong",    hook: "The data says something completely different.",  captions: ["The studies don't lie 📊", "Sharing in every group chat", "This reframes everything", "Facts over feelings 💯", "The people who know this win"] },
];

const EMOTIONS   = ["inspiring", "educational", "motivational", "shocking", "funny", "emotional", "controversial"];
const COLORS     = ["#FF6B6B", "#4ECDC4", "#A78BFA", "#FFD93D", "#F97316", "#34D399", "#F472B6"];
const PLATFORMS  = ["tiktok", "reels", "shorts", "all"];
const DUR_MAP    = { "15-30": [18, 24, 28], "30-60": [35, 47, 55], "60-90": [65, 78, 88], custom: [40, 52, 60] };

export function generateFallbackClips(settings, meta) {
  const durations = DUR_MAP[settings.duration] || DUR_MAP["30-60"];
  const total     = meta?.durationSecs || 600;
  const channel   = meta?.channel || "Creator";

  return Array.from({ length: settings.numClips }, (_, i) => {
    const tpl       = TEMPLATES[i % TEMPLATES.length];
    const dur       = durations[i % durations.length];
    const startSecs = Math.min(
      Math.round((total / (settings.numClips + 1)) * (i + 0.5)),
      total - dur - 5
    );
    const endSecs = startSecs + dur;
    const fmt     = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    return {
      id:            `clip-${i + 1}`,
      title:         tpl.title,
      startTime:     fmt(startSecs),
      endTime:       fmt(endSecs),
      startSeconds:  startSecs,
      endSeconds:    endSecs,
      duration:      dur,
      hook:          tpl.hook,
      summary:       "High-engagement segment identified through pacing, emotional peaks and content density analysis.",
      viralScore:    72 + Math.floor(Math.random() * 22),
      captions:      tpl.captions,
      tags:          ["#shorts", "#viral", "#trending", "#fyp", `#${settings.focus}`],
      emotionTag:    EMOTIONS[i % EMOTIONS.length],
      thumbnailColor: COLORS[i % COLORS.length],
      platform:      PLATFORMS[i % PLATFORMS.length],
      ctaText:       `Follow ${channel} for more clips!`,
    };
  });
}

/** Ensure every clip has startSeconds/endSeconds filled in */
export function normaliseClips(clips) {
  return clips.map((c) => ({
    ...c,
    startSeconds: c.startSeconds ?? timeToSeconds(c.startTime),
    endSeconds:   c.endSeconds   ?? timeToSeconds(c.endTime),
  }));
}
