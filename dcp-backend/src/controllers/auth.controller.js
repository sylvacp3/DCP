const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }

  const { rows } = await db.query(
    'SELECT id, nom, email, mot_de_passe, role, actif FROM utilisateurs WHERE email = $1',
    [email]
  );
  const user = rows[0];

  if (!user || !user.actif) {
    return res.status(401).json({ message: 'Identifiants incorrects.' });
  }

  const valide = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
  if (!valide) {
    return res.status(401).json({ message: 'Identifiants incorrects.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, nom: user.nom },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({
    token,
    user: { id: user.id, nom: user.nom, email: user.email, role: user.role },
  });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, nom, email, role, actif, cree_le FROM utilisateurs WHERE id = $1',
    [req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Utilisateur introuvable.' });
  res.json(rows[0]);
});

module.exports = { login, me };
