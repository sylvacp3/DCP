-- =====================================================================
-- DCP MATÉRIEL — Trésor Madagascar
-- Schéma de base de données PostgreSQL
-- =====================================================================

-- Extension pour générer des UUID si besoin plus tard (facultatif ici,
-- on utilise des identifiants auto-incrémentés pour rester simple)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- TYPES ÉNUMÉRÉS
-- =====================================================================

CREATE TYPE role_utilisateur AS ENUM ('admin', 'gestionnaire', 'consultation');
CREATE TYPE type_mouvement AS ENUM ('definitive', 'temporaire');
CREATE TYPE statut_bordereau AS ENUM ('en_cours', 'validee', 'annulee');
CREATE TYPE statut_maintenance AS ENUM ('planifiee', 'en_cours', 'terminee', 'annulee');
CREATE TYPE statut_inventaire AS ENUM ('en_cours', 'cloture');

-- =====================================================================
-- UTILISATEURS (authentification / accès à l'application)
-- =====================================================================

CREATE TABLE utilisateurs (
  id              SERIAL PRIMARY KEY,
  nom             VARCHAR(120) NOT NULL,
  email           VARCHAR(160) NOT NULL UNIQUE,
  mot_de_passe    VARCHAR(255) NOT NULL,     -- hash bcrypt
  role            role_utilisateur NOT NULL DEFAULT 'consultation',
  actif           BOOLEAN NOT NULL DEFAULT TRUE,
  cree_le         TIMESTAMPTZ NOT NULL DEFAULT now(),
  maj_le          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- SERVICES (bénéficiaires / structures du Trésor)
-- =====================================================================

CREATE TABLE services (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(30) NOT NULL UNIQUE,
  nom             VARCHAR(160) NOT NULL,
  localisation    VARCHAR(160),
  cree_le         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- AGENTS (annuaire des agents rattachés à un service)
-- =====================================================================

CREATE TABLE agents (
  id              SERIAL PRIMARY KEY,
  matricule       VARCHAR(30) NOT NULL UNIQUE,
  nom             VARCHAR(120) NOT NULL,
  fonction        VARCHAR(120),
  email           VARCHAR(160),
  telephone       VARCHAR(30),
  service_id      INTEGER REFERENCES services(id) ON DELETE SET NULL,
  actif           BOOLEAN NOT NULL DEFAULT TRUE,
  cree_le         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- FOURNISSEURS
-- =====================================================================

CREATE TABLE fournisseurs (
  id              SERIAL PRIMARY KEY,
  nom             VARCHAR(160) NOT NULL,
  contact_nom     VARCHAR(120),
  telephone       VARCHAR(30),
  email           VARCHAR(160),
  adresse         VARCHAR(255),
  cree_le         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- CATÉGORIES DE MATÉRIEL
-- =====================================================================

CREATE TABLE categories_materiel (
  id              SERIAL PRIMARY KEY,
  nom             VARCHAR(100) NOT NULL UNIQUE
);

-- =====================================================================
-- MATÉRIELS (catalogue + stock courant)
-- =====================================================================

CREATE TABLE materiels (
  id                  SERIAL PRIMARY KEY,
  code_inventaire     VARCHAR(40) NOT NULL UNIQUE,   -- ex: DCP-2024-0142
  nom                 VARCHAR(160) NOT NULL,
  categorie_id        INTEGER REFERENCES categories_materiel(id) ON DELETE SET NULL,
  fournisseur_id      INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL,
  unite               VARCHAR(30) NOT NULL DEFAULT 'unité',
  valeur_unitaire     NUMERIC(14,2) NOT NULL DEFAULT 0,
  stock_total         INTEGER NOT NULL DEFAULT 0,     -- quantité totale possédée
  stock_disponible    INTEGER NOT NULL DEFAULT 0,     -- quantité non affectée
  seuil_alerte        INTEGER NOT NULL DEFAULT 1,     -- alerte stock bas
  cree_le             TIMESTAMPTZ NOT NULL DEFAULT now(),
  maj_le              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (stock_disponible >= 0 AND stock_disponible <= stock_total)
);

CREATE INDEX idx_materiels_nom ON materiels USING gin (to_tsvector('french', nom));

-- =====================================================================
-- ENTRÉES / RÉCEPTIONS (approvisionnement depuis un fournisseur)
-- =====================================================================

CREATE TABLE entrees (
  id              SERIAL PRIMARY KEY,
  numero          VARCHAR(40) NOT NULL UNIQUE,       -- ex: ENT-2026-0031
  fournisseur_id  INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL,
  date_entree     DATE NOT NULL DEFAULT CURRENT_DATE,
  valide_par      INTEGER REFERENCES utilisateurs(id),
  observation     TEXT,
  cree_le         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE entree_lignes (
  id              SERIAL PRIMARY KEY,
  entree_id       INTEGER NOT NULL REFERENCES entrees(id) ON DELETE CASCADE,
  materiel_id     INTEGER NOT NULL REFERENCES materiels(id),
  quantite        INTEGER NOT NULL CHECK (quantite > 0),
  prix_unitaire   NUMERIC(14,2) NOT NULL
);

-- =====================================================================
-- SORTIES (bordereaux d'affectation — coeur du mockup "Nouvelle sortie")
-- =====================================================================

CREATE TABLE sorties (
  id                SERIAL PRIMARY KEY,
  numero_bordereau  VARCHAR(40) NOT NULL UNIQUE,     -- ex: BS-2026-0142
  agent_id          INTEGER REFERENCES agents(id),
  service_id        INTEGER REFERENCES services(id),
  type_mouvement    type_mouvement NOT NULL DEFAULT 'definitive',
  statut            statut_bordereau NOT NULL DEFAULT 'en_cours',
  date_sortie       DATE NOT NULL DEFAULT CURRENT_DATE,
  date_retour_prevue DATE,                           -- utile si prêt temporaire
  valide_par        INTEGER REFERENCES utilisateurs(id),
  cree_par          INTEGER REFERENCES utilisateurs(id),
  cree_le           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sortie_lignes (
  id              SERIAL PRIMARY KEY,
  sortie_id       INTEGER NOT NULL REFERENCES sorties(id) ON DELETE CASCADE,
  materiel_id     INTEGER NOT NULL REFERENCES materiels(id),
  quantite        INTEGER NOT NULL CHECK (quantite > 0),
  valeur_unitaire NUMERIC(14,2) NOT NULL
);

-- =====================================================================
-- MAINTENANCE
-- =====================================================================

CREATE TABLE maintenances (
  id              SERIAL PRIMARY KEY,
  materiel_id     INTEGER NOT NULL REFERENCES materiels(id),
  description     TEXT NOT NULL,
  statut          statut_maintenance NOT NULL DEFAULT 'planifiee',
  date_debut      DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin        DATE,
  cout            NUMERIC(14,2) DEFAULT 0,
  cree_le         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- INVENTAIRE ANNUEL
-- =====================================================================

CREATE TABLE inventaires (
  id              SERIAL PRIMARY KEY,
  annee           INTEGER NOT NULL,
  date_realisation DATE,
  statut          statut_inventaire NOT NULL DEFAULT 'en_cours',
  cree_par        INTEGER REFERENCES utilisateurs(id),
  cree_le         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(annee)
);

CREATE TABLE inventaire_lignes (
  id                  SERIAL PRIMARY KEY,
  inventaire_id       INTEGER NOT NULL REFERENCES inventaires(id) ON DELETE CASCADE,
  materiel_id         INTEGER NOT NULL REFERENCES materiels(id),
  quantite_theorique  INTEGER NOT NULL,
  quantite_constatee  INTEGER,
  ecart               INTEGER GENERATED ALWAYS AS (quantite_constatee - quantite_theorique) STORED,
  observation         TEXT
);

-- =====================================================================
-- TRIGGERS UTILITAIRES : mise à jour automatique de "maj_le"
-- =====================================================================

CREATE OR REPLACE FUNCTION set_maj_le()
RETURNS TRIGGER AS $$
BEGIN
  NEW.maj_le = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_materiels_maj_le
  BEFORE UPDATE ON materiels
  FOR EACH ROW EXECUTE FUNCTION set_maj_le();

CREATE TRIGGER trg_utilisateurs_maj_le
  BEFORE UPDATE ON utilisateurs
  FOR EACH ROW EXECUTE FUNCTION set_maj_le();

-- =====================================================================
-- INDEX complémentaires
-- =====================================================================

CREATE INDEX idx_sorties_agent ON sorties(agent_id);
CREATE INDEX idx_sorties_service ON sorties(service_id);
CREATE INDEX idx_sortie_lignes_materiel ON sortie_lignes(materiel_id);
CREATE INDEX idx_maintenances_materiel ON maintenances(materiel_id);
