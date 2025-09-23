// app/server.js
// API Express minimale pour le POC DevOps Timi
// - /metrics : métriques Prometheus (prom-client)
// - /health : 200 même si la DB est absente (CI/CD sans Postgres)
// - /chantiers : endpoints réels (DB requise)

const express = require("express");
const cors = require("cors");
const { query } = require("./db");
const client = require("prom-client");

// 1) INITIALISATION APP (à faire AVANT tout app.use/app.get)
const app = express();
app.use(cors());
app.use(express.json());

// 2) METRICS PROMETHEUS
const register = new client.Registry();
client.collectDefaultMetrics({ register });

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

// Middleware d’instrumentation
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const dur = Number(process.hrtime.bigint() - start) / 1e9;
    httpRequests.inc({ method: req.method, route: req.path, code: String(res.statusCode) });
    httpDuration.observe({ method: req.method, route: req.path, code: String(res.statusCode) }, dur);
  });
  next();
});

// Endpoint /metrics
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// 3) ROUTES API
app.get("/", (_req, res) => {
  res.json({ message: "Timi Contractors DevOps POC (API)" });
});

// /health : OK même si DB absente
app.get("/health", async (_req, res) => {
  const hasDbUrl = !!(process.env.DB_URL || process.env.DATABASE_URL);
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

// CHANTIERS
app.get("/chantiers", async (_req, res) => {
  try {
    const { rows } = await query("SELECT * FROM chantiers ORDER BY id ASC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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

// 4) LANCEMENT (pas en mode test pour Jest)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

module.exports = app;
