import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

function fmt(n) {
  return Number(n).toLocaleString('fr-FR').replace(/,/g, ' ') + ' Ar';
}

const STATUT_LABEL = {
  en_cours: 'En cours',
  validee: 'Validée',
  annulee: 'Annulée',
};

export default function Sorties() {
  const [sorties, setSorties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    api.get('/sorties')
      .then(setSorties)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleAnnuler(id) {
    if (!confirm('Annuler ce bordereau et restituer le stock ?')) return;
    try {
      await api.post(`/sorties/${id}/annuler`);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="loading-state">Chargement...</div>;

  return (
    <>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Sorties</h1>
          <p>Historique des bordereaux d'affectation</p>
        </div>
        <Link to="/sorties" style={{ color: 'var(--gold)', fontSize: 13, textDecoration: 'none' }}>
          + Nouvelle sortie
        </Link>
      </div>

      {error && <div className="alert error" style={{ marginTop: 20 }}>{error}</div>}

      <div className="table-wrap" style={{ marginTop: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Bordereau</th>
              <th>Bénéficiaire</th>
              <th>Mouvement</th>
              <th>Statut</th>
              <th>Valeur</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorties.map((s) => (
              <tr key={s.id}>
                <td><span className="badge">{s.numero_bordereau}</span></td>
                <td>{s.agent_nom || s.service_nom || '—'}</td>
                <td>{s.type_mouvement === 'definitive' ? 'Définitive' : 'Temporaire'}</td>
                <td>{STATUT_LABEL[s.statut]}</td>
                <td>{fmt(s.valeur_totale)}</td>
                <td>{new Date(s.date_sortie).toLocaleDateString('fr-FR')}</td>
                <td>
                  {s.statut !== 'annulee' && (
                    <span className="remove-x" onClick={() => handleAnnuler(s.id)} title="Annuler">✕</span>
                  )}
                </td>
              </tr>
            ))}
            {sorties.length === 0 && (
              <tr><td colSpan={7} style={{ color: 'var(--ivory-dim)' }}>Aucun bordereau pour le moment.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
