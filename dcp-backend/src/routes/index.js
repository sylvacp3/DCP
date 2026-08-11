const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/materiels', require('./materiels.routes'));
router.use('/services', require('./services.routes'));
router.use('/agents', require('./agents.routes'));
router.use('/fournisseurs', require('./fournisseurs.routes'));
router.use('/sorties', require('./sorties.routes'));

module.exports = router;
