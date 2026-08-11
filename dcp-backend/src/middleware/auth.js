const jwt = require('jsonwebtoken');

/**
 * Vérifie la présence et la validité du token JWT dans l'en-tête
 * Authorization: Bearer <token>
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentification requise.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
}

/**
 * Restreint l'accès à une liste de rôles.
 * Usage : requireRole('admin', 'gestionnaire')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé pour votre rôle." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
