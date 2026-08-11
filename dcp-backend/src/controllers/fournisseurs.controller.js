const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM fournisseurs ORDER BY nom ASC');
  res.json(rows);
});

const getOne = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM fournisseurs WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Fournisseur introuvable.' });
  res.json(rows[0]);
});

const create = asyncHandler(async (req, res) => {
  const { nom, contact_nom, telephone, email, adresse } = req.body;
  if (!nom) return res.status(400).json({ message: 'nom est requis.' });

  const { rows } = await db.query(
    `INSERT INTO fournisseurs (nom, contact_nom, telephone, email, adresse)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [nom, contact_nom || null, telephone || null, email || null, adresse || null]
  );
  res.status(201).json(rows[0]);
});

const update = asyncHandler(async (req, res) => {
  const { nom, contact_nom, telephone, email, adresse } = req.body;
  const { rows } = await db.query(
    `UPDATE fournisseurs SET
       nom = COALESCE($1, nom),
       contact_nom = COALESCE($2, contact_nom),
       telephone = COALESCE($3, telephone),
       email = COALESCE($4, email),
       adresse = COALESCE($5, adresse)
     WHERE id = $6 RETURNING *`,
    [nom, contact_nom, telephone, email, adresse, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Fournisseur introuvable.' });
  res.json(rows[0]);
});

const remove = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM fournisseurs WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ message: 'Fournisseur introuvable.' });
  res.status(204).send();
});

module.exports = { list, getOne, create, update, remove };
