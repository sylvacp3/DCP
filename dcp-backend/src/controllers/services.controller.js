const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM services ORDER BY nom ASC');
  res.json(rows);
});

const getOne = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Service introuvable.' });
  res.json(rows[0]);
});

const create = asyncHandler(async (req, res) => {
  const { code, nom, localisation } = req.body;
  if (!code || !nom) return res.status(400).json({ message: 'code et nom sont requis.' });

  const { rows } = await db.query(
    'INSERT INTO services (code, nom, localisation) VALUES ($1,$2,$3) RETURNING *',
    [code, nom, localisation || null]
  );
  res.status(201).json(rows[0]);
});

const update = asyncHandler(async (req, res) => {
  const { nom, localisation } = req.body;
  const { rows } = await db.query(
    `UPDATE services SET nom = COALESCE($1, nom), localisation = COALESCE($2, localisation)
     WHERE id = $3 RETURNING *`,
    [nom, localisation, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Service introuvable.' });
  res.json(rows[0]);
});

const remove = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM services WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ message: 'Service introuvable.' });
  res.status(204).send();
});

module.exports = { list, getOne, create, update, remove };
