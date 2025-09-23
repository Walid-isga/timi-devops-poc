// app/server.js
// API Express minimale pour le POC DevOps Timi
// - /health : renvoie 200 même si la DB est absente (CI/CD sans Postgres)
// - /chantiers : endpoints réels (nécessitent la DB)

const express = require("express");
const cors = require("cors");
const { query } = require("./db"); // helper Postgres (peut échouer si DB absente)
const client = require("prom-client");

// registre + métriques par défaut
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// métriques custom HTTP
const httpRequests = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "code"],
});
const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration (s)",
  labelNames: ["method", "route", "code"],
  buckets: [0.05, 0.1, 0.3, 0.6, 1, 2, 5],
});
register.registerMetric(httpRequests);
register.registerMetric(httpDuration);

// petit middleware pour instrumenter
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const dur = Number(process.hrtime.bigint() - start) / 1e9;
    httpRequests.inc({ method: req.method, route: req.path, code: String(res.statusCode) });
    httpDuration.observe({ method: req.method, route: req.path, code: String(res.statusCode) }, dur);
  });
  next();
});

// endpoint /metrics
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});


const app = express();
app.use(cors());
app.use(express.json());

// Page d'accueil simple
app.get("/", (_req, res) => {
  res.json({ message: "Timi Contractors DevOps POC (API)" });
});

// ---------- HEALTHCHECK ----------
// Objectif : ne jamais casser la CI si la DB n'est pas présente.
// Comportement : 200 OK dans tous les cas.
//   - db = "up" si SELECT 1 fonctionne
//   - db = "down" si échec (absence de DB, mauvaise URL, etc.)
app.get("/health", async (_req, res) => {
  const hasDbUrl = !!process.env.DB_URL; // si pas défini (CI), on ne tente même pas
  if (!hasDbUrl) {
    return res.json({ status: "ok", db: "down", ts: Date.now() });
  }
  try {
    await query("SELECT 1 AS ok");
    return res.json({ status: "ok", db: "up", ts: Date.now() });
  } catch (e) {
    return res.json({ status: "ok", db: "down", ts: Date.now() });
  }
});

// ---------- CHANTIERS (DB requise) ----------
// GET /chantiers : liste (depuis Postgres)
app.get("/chantiers", async (_req, res) => {
  try {
    const { rows } = await query("SELECT * FROM chantiers ORDER BY id ASC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /chantiers : ajout
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

// IMPORTANT : en tests (Jest + Supertest), on n'ouvre PAS de port.
// Supertest injecte les requêtes directement sur "app".
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

module.exports = app;
