// Enveloppe un contrôleur async pour transmettre automatiquement
// les erreurs au middleware de gestion d'erreurs, sans try/catch répété.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
