const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Génère un numéro de bordereau du type BS-2026-0001
async function genererNumero(client) {
  const annee = new Date().getFullYear();
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS total FROM sorties WHERE numero_bordereau LIKE $1`,
    [`BS-${annee}-%`]
  );
  const suivant = (rows[0].total + 1).toString().padStart(4, '0');
  return `BS-${annee}-${suivant}`;
}

// GET /api/sorties
const list = asyncHandler(async (req, res) => {
  const { statut } = req.query;
  const params = [];
  let where = '';
  if (statut) {
    params.push(statut);
    where = `WHERE s.statut = $1`;
  }
  const { rows } = await db.query(
    `SELECT s.*, a.nom AS agent_nom, sv.nom AS service_nom,
            (SELECT COALESCE(SUM(l.quantite * l.valeur_unitaire), 0)
             FROM sortie_lignes l WHERE l.sortie_id = s.id) AS valeur_totale
     FROM sorties s
     LEFT JOIN agents a ON a.id = s.agent_id
     LEFT JOIN services sv ON sv.id = s.service_id
     ${where}
     ORDER BY s.cree_le DESC`,
    params
  );
  res.json(rows);
});

// GET /api/sorties/:id  (avec ses lignes)
const getOne = asyncHandler(async (req, res) => {
  const { rows: sortieRows } = await db.query(
    `SELECT s.*, a.nom AS agent_nom, sv.nom AS service_nom
     FROM sorties s
     LEFT JOIN agents a ON a.id = s.agent_id
     LEFT JOIN services sv ON sv.id = s.service_id
     WHERE s.id = $1`,
    [req.params.id]
  );
  if (!sortieRows[0]) return res.status(404).json({ message: 'Bordereau introuvable.' });

  const { rows: lignes } = await db.query(
    `SELECT l.*, m.nom AS materiel_nom, m.code_inventaire
     FROM sortie_lignes l
     JOIN materiels m ON m.id = l.materiel_id
     WHERE l.sortie_id = $1`,
    [req.params.id]
  );

  res.json({ ...sortieRows[0], lignes });
});

// POST /api/sorties
// body: { agent_id, service_id, type_mouvement, date_retour_prevue, lignes: [{ materiel_id, quantite }] }
const create = asyncHandler(async (req, res) => {
  const { agent_id, service_id, type_mouvement, date_retour_prevue, lignes } = req.body;

  if (!Array.isArray(lignes) || lignes.length === 0) {
    return res.status(400).json({ message: 'Le bordereau doit contenir au moins une ligne.' });
  }
  if (!agent_id && !service_id) {
    return res.status(400).json({ message: 'Un agent ou un service bénéficiaire est requis.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Verrouille et vérifie le stock disponible pour chaque ligne
    const lignesAvecValeur = [];
    for (const ligne of lignes) {
      const { rows } = await client.query(
        `SELECT id, nom, valeur_unitaire, stock_disponible
         FROM materiels WHERE id = $1 FOR UPDATE`,
        [ligne.materiel_id]
      );
      const materiel = rows[0];
      if (!materiel) throw { status: 404, message: `Matériel ${ligne.materiel_id} introuvable.` };
      if (ligne.quantite <= 0) throw { status: 400, message: 'Quantité invalide.' };
      if (materiel.stock_disponible < ligne.quantite) {
        throw {
          status: 409,
          message: `Stock insuffisant pour "${materiel.nom}" (disponible : ${materiel.stock_disponible}).`,
        };
      }
      lignesAvecValeur.push({ ...ligne, valeur_unitaire: materiel.valeur_unitaire });
    }

    const numero = await genererNumero(client);

    const { rows: sortieRows } = await client.query(
      `INSERT INTO sorties (numero_bordereau, agent_id, service_id, type_mouvement, date_retour_prevue, cree_par, valide_par, statut)
       VALUES ($1,$2,$3,COALESCE($4,'definitive'),$5,$6,$6,'validee')
       RETURNING *`,
      [numero, agent_id || null, service_id || null, type_mouvement, date_retour_prevue || null, req.user.id]
    );
    const sortie = sortieRows[0];

    for (const ligne of lignesAvecValeur) {
      await client.query(
        `INSERT INTO sortie_lignes (sortie_id, materiel_id, quantite, valeur_unitaire)
         VALUES ($1,$2,$3,$4)`,
        [sortie.id, ligne.materiel_id, ligne.quantite, ligne.valeur_unitaire]
      );
      await client.query(
        `UPDATE materiels SET stock_disponible = stock_disponible - $1 WHERE id = $2`,
        [ligne.quantite, ligne.materiel_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(sortie);
  } catch (err) {
    await client.query('ROLLBACK');
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Erreur lors de la création du bordereau.' });
  } finally {
    client.release();
  }
});

// POST /api/sorties/:id/annuler — annule un bordereau et restitue le stock
const annuler = asyncHandler(async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT * FROM sorties WHERE id = $1 FOR UPDATE', [req.params.id]);
    const sortie = rows[0];
    if (!sortie) throw { status: 404, message: 'Bordereau introuvable.' };
    if (sortie.statut === 'annulee') throw { status: 409, message: 'Ce bordereau est déjà annulé.' };

    const { rows: lignes } = await client.query(
      'SELECT materiel_id, quantite FROM sortie_lignes WHERE sortie_id = $1',
      [sortie.id]
    );
    for (const ligne of lignes) {
      await client.query(
        'UPDATE materiels SET stock_disponible = stock_disponible + $1 WHERE id = $2',
        [ligne.quantite, ligne.materiel_id]
      );
    }

    await client.query(`UPDATE sorties SET statut = 'annulee' WHERE id = $1`, [sortie.id]);

    await client.query('COMMIT');
    res.json({ message: 'Bordereau annulé, stock restitué.' });
  } catch (err) {
    await client.query('ROLLBACK');
    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Erreur lors de l'annulation." });
  } finally {
    client.release();
  }
});

module.exports = { list, getOne, create, annuler };
