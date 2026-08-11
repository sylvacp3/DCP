// Applique src/db/schema.sql à la base configurée dans .env
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('→ Application du schéma...');
  await pool.query(sql);
  console.log('✓ Schéma appliqué avec succès.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('✗ Échec de la migration :', err.message);
  process.exit(1);
});
