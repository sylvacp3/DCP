const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { service_id } = req.query;
  const params = [];
  let where = '';
  if (service_id) {
    params.push(service_id);
    where = `WHERE a.service_id = $1`;
  }
  const { rows } = await db.query(
    `SELECT a.*, s.nom AS service_nom
     FROM agents a
     LEFT JOIN services s ON s.id = a.service_id
     ${where}
     ORDER BY a.nom ASC`,
    params
  );
  res.json(rows);
});

const getOne = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT a.*, s.nom AS service_nom FROM agents a
     LEFT JOIN services s ON s.id = a.service_id WHERE a.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Agent introuvable.' });
  res.json(rows[0]);
});

const create = asyncHandler(async (req, res) => {
  const { matricule, nom, fonction, email, telephone, service_id } = req.body;
  if (!matricule || !nom) return res.status(400).json({ message: 'matricule et nom sont requis.' });

  const { rows } = await db.query(
    `INSERT INTO agents (matricule, nom, fonction, email, telephone, service_id)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [matricule, nom, fonction || null, email || null, telephone || null, service_id || null]
  );
  res.status(201).json(rows[0]);
});

const update = asyncHandler(async (req, res) => {
  const { nom, fonction, email, telephone, service_id, actif } = req.body;
  const { rows } = await db.query(
    `UPDATE agents SET
       nom = COALESCE($1, nom),
       fonction = COALESCE($2, fonction),
       email = COALESCE($3, email),
       telephone = COALESCE($4, telephone),
       service_id = COALESCE($5, service_id),
       actif = COALESCE($6, actif)
     WHERE id = $7 RETURNING *`,
    [nom, fonction, email, telephone, service_id, actif, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Agent introuvable.' });
  res.json(rows[0]);
});

const remove = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM agents WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ message: 'Agent introuvable.' });
  res.status(204).send();
});

module.exports = { list, getOne, create, update, remove };
