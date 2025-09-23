// app/server.js (extrait)
const express = require("express");
const cors = require("cors");
const { query, pool } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Timi Contractors DevOps POC (API)" });
});

app.get("/health", async (_req, res) => {
  try {
    // test connexion DB
    await query("SELECT 1 AS ok");
    res.json({ status: "ok", db: "up", ts: Date.now() });
  } catch (e) {
    console.error("Health DB error:", e.message); // 🔎 log l’erreur côté serveur
    // renvoie les détails pour debug (temporaire)
    res.status(200).json({
      status: "ok",
      db: "down",
      error: e.message,
      ts: Date.now(),
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

module.exports = app;
