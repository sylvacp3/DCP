-- =====================================================================
-- Données de démonstration — à exécuter après schema.sql
-- Mot de passe de l'utilisateur admin de test : "admin1234"
-- (hash bcrypt généré pour cette valeur — voir README pour le regénérer)
-- =====================================================================

INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES
('Administrateur DCP', 'admin@tresor.mg', '$2b$10$Pma6f3aYdiZvYVUOdJ2G3.Te7uqaJmG1AxSdZvl1VaCxVOdQZGseu', 'admin');
-- Ce hash correspond au mot de passe "admin1234" (à changer en production).

INSERT INTO categories_materiel (nom) VALUES
('Informatique'), ('Mobilier'), ('Climatisation'), ('Bureautique'), ('Télécommunication');

INSERT INTO services (code, nom, localisation) VALUES
('SVC-ORD', 'Service Ordonnancement — DCP', 'Antananarivo'),
('DGT', 'Direction Générale du Trésor', 'Antananarivo'),
('RF-TOA', 'Recette de Finances', 'Toamasina'),
('PP-TOA', 'Perception Principale', 'Toamasina'),
('ACC', 'Agence Comptable Centrale', 'Antananarivo');

INSERT INTO fournisseurs (nom, contact_nom, telephone, email) VALUES
('Telma Business', 'Rakoto Jean', '034 00 000 01', 'contact@telmabusiness.mg'),
('BIS Madagascar', 'Rasoa Marie', '032 00 000 02', 'ventes@bis.mg'),
('Ocean Trade', 'Andry Paul', '033 00 000 03', 'info@oceantrade.mg');

INSERT INTO agents (matricule, nom, fonction, service_id) VALUES
('MAT-0001', 'Rabe Solo', 'Chef de service', 1),
('MAT-0002', 'Raharison Nirina', 'Comptable', 2),
('MAT-0003', 'Randria Faly', 'Percepteur', 4);

INSERT INTO materiels (code_inventaire, nom, categorie_id, fournisseur_id, unite, valeur_unitaire, stock_total, stock_disponible, seuil_alerte) VALUES
('DCP-2024-0142', 'Ordinateur portable HP', 1, 1, 'unité', 2100000, 8, 6, 2),
('DCP-2023-0087', 'Onduleur 1000VA', 1, 2, 'unité', 340000, 15, 11, 3),
('DCP-2024-0055', 'Imprimante laser Canon', 4, 2, 'unité', 980000, 5, 4, 1),
('DCP-2022-0210', 'Armoire métallique', 2, 3, 'unité', 610000, 4, 3, 1),
('DCP-2023-0134', 'Climatiseur split 1CV', 3, 3, 'unité', 1450000, 3, 2, 1),
('DCP-2024-0019', 'Vidéoprojecteur Epson', 4, 1, 'unité', 1250000, 6, 5, 1),
('DCP-2021-0078', 'Photocopieuse Ricoh', 4, 2, 'unité', 4200000, 1, 1, 1),
('DCP-2024-0301', 'Chaise de bureau', 2, 3, 'unité', 95000, 30, 24, 5),
('DCP-2024-0066', 'Téléphone IP Yealink', 5, 1, 'unité', 210000, 10, 9, 2);
