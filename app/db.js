// app/db.js
// Rôle : créer un pool de connexions Postgres réutilisable par l'API.

const { Pool } = require("pg");

// On lit la variable d'environnement DB_URL (définie dans .env et passée au conteneur)
const connectionString = process.env.DB_URL;

// Le pool gère les connexions efficacement
const pool = new Pool({
  connectionString,
  // tu peux ajouter ssl, timeouts, etc. selon besoin
});

// Petite fonction helper pour faire des requêtes SQL
async function query(text, params) {
  // text: la requête SQL ; params: tableau de valeurs pour $1, $2, ...
  return pool.query(text, params);
}

module.exports = { pool, query };
