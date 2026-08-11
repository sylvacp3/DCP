const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable.' });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur.' });
});

module.exports = app;
