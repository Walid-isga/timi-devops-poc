// app/db.js
const { Pool } = require("pg");

// accepte DB_URL ou DATABASE_URL ; fallback local utile en dev
const connectionString =
  process.env.DB_URL ||
  process.env.DATABASE_URL ||
  "postgres://timi_user:timi_pass@localhost:5432/timi_db";

const pool = new Pool({
  connectionString,
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("PG pool error:", err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
