// app/db.js
const { Pool } = require("pg");

// Utilise DATABASE_URL si dispo, sinon une valeur locale par défaut
const connectionString =
  process.env.DATABASE_URL ||
  "postgres://timi_user:timi_pass@localhost:5432/timi_db";

// Important : désactive SSL pour le cluster local (Kind)
const pool = new Pool({
  connectionString,
  ssl: false,
  // optionnel mais utile pour debug
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("PG pool error:", err); // log clair si une connexion tombe
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
