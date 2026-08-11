const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/materiels?recherche=...&categorie_id=...
const list = asyncHandler(async (req, res) => {
  const { recherche, categorie_id } = req.query;
  const conditions = [];
  const params = [];

  if (recherche) {
    params.push(`%${recherche}%`);
    conditions.push(
      `(m.nom ILIKE $${params.length} OR m.code_inventaire ILIKE $${params.length})`
    );
  }
  if (categorie_id) {
    params.push(categorie_id);
    conditions.push(`m.categorie_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await db.query(
    `SELECT m.*, c.nom AS categorie_nom, f.nom AS fournisseur_nom
     FROM materiels m
     LEFT JOIN categories_materiel c ON c.id = m.categorie_id
     LEFT JOIN fournisseurs f ON f.id = m.fournisseur_id
     ${where}
     ORDER BY m.nom ASC`,
    params
  );
  res.json(rows);
});

// GET /api/materiels/:id
const getOne = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT m.*, c.nom AS categorie_nom, f.nom AS fournisseur_nom
     FROM materiels m
     LEFT JOIN categories_materiel c ON c.id = m.categorie_id
     LEFT JOIN fournisseurs f ON f.id = m.fournisseur_id
     WHERE m.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Matériel introuvable.' });
  res.json(rows[0]);
});

// POST /api/materiels
const create = asyncHandler(async (req, res) => {
  const {
    code_inventaire, nom, categorie_id, fournisseur_id,
    unite, valeur_unitaire, stock_total, seuil_alerte,
  } = req.body;

  if (!code_inventaire || !nom) {
    return res.status(400).json({ message: 'code_inventaire et nom sont requis.' });
  }

  const { rows } = await db.query(
    `INSERT INTO materiels
      (code_inventaire, nom, categorie_id, fournisseur_id, unite, valeur_unitaire, stock_total, stock_disponible, seuil_alerte)
     VALUES ($1,$2,$3,$4,COALESCE($5,'unité'),COALESCE($6,0),COALESCE($7,0),COALESCE($7,0),COALESCE($8,1))
     RETURNING *`,
    [code_inventaire, nom, categorie_id || null, fournisseur_id || null, unite, valeur_unitaire, stock_total, seuil_alerte]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/materiels/:id
const update = asyncHandler(async (req, res) => {
  const { nom, categorie_id, fournisseur_id, unite, valeur_unitaire, seuil_alerte } = req.body;

  const { rows } = await db.query(
    `UPDATE materiels SET
       nom = COALESCE($1, nom),
       categorie_id = COALESCE($2, categorie_id),
       fournisseur_id = COALESCE($3, fournisseur_id),
       unite = COALESCE($4, unite),
       valeur_unitaire = COALESCE($5, valeur_unitaire),
       seuil_alerte = COALESCE($6, seuil_alerte)
     WHERE id = $7
     RETURNING *`,
    [nom, categorie_id, fournisseur_id, unite, valeur_unitaire, seuil_alerte, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Matériel introuvable.' });
  res.json(rows[0]);
});

// DELETE /api/materiels/:id
const remove = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM materiels WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ message: 'Matériel introuvable.' });
  res.status(204).send();
});

module.exports = { list, getOne, create, update, remove };
