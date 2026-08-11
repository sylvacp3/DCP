const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

pool.on('error', (err) => {
  console.error('Erreur inattendue sur le pool PostgreSQL', err);
  process.exit(1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
