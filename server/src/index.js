const express = require("express");
const cors    = require("cors");
const path    = require("path");
const apiRouter = require("./routes/api");

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

// ─── API ─────────────────────────────────────────────────────────────────────
app.use("/api", apiRouter);

// ─── Serve built frontend (production) ───────────────────────────────────────
const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_, res) => {
  const index = path.join(clientDist, "index.html");
  res.sendFile(index);
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  ClipForge server  →  http://localhost:${PORT}`);
  console.log(`   API:               →  http://localhost:${PORT}/api/health\n`);
});
