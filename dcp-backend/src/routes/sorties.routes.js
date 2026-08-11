const router = require('express').Router();
const ctrl = require('../controllers/sorties.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', requireRole('admin', 'gestionnaire'), ctrl.create);
router.post('/:id/annuler', requireRole('admin', 'gestionnaire'), ctrl.annuler);

module.exports = router;
