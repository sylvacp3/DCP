// Charge src/db/seed.sql — données de démonstration
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function seed() {
  const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  console.log('→ Insertion des données de démonstration...');
  await pool.query(sql);
  console.log('✓ Données de démonstration insérées.');
  await pool.end();
}

seed().catch((err) => {
  console.error('✗ Échec du seed :', err.message);
  process.exit(1);
});
