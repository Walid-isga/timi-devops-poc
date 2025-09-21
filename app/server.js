const express = require("express");
const cors = require("cors");
const { query } = require("./db"); // <-- on importe notre helper

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Timi Contractors DevOps POC (API)" });
});

app.get("/health", async (_req, res) => {
  // On vérifie aussi la DB pour être sûr que tout va bien
  try {
    await query("SELECT 1 AS ok");
    res.json({ status: "ok", db: "up", ts: Date.now() });
  } catch (e) {
    res.status(500).json({ status: "degraded", db: "down", error: e.message });
  }
});

// Liste des chantiers depuis la DB
app.get("/health", async (_req, res) => {
    try {
      await query("SELECT 1 AS ok");
      res.json({ status: "ok", db: "up", ts: Date.now() });
    } catch (e) {
      // ⚠️ au lieu de 500, on renvoie 200 avec info dégradée
      res.json({ status: "ok", db: "down", ts: Date.now() });
    }
  });
  

// Ajout d'un chantier
app.post("/chantiers", async (req, res) => {
  const { nom, debut = null, fin = null, statut = "planifie" } = req.body || {};
  if (!nom) return res.status(400).json({ error: "nom requis" });

  try {
    const { rows } = await query(
      "INSERT INTO chantiers (nom, debut, fin, statut) VALUES ($1,$2,$3,$4) RETURNING *",
      [nom, debut, fin, statut]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

module.exports = app;
