import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/agents')
      .then(setAgents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Chargement...</div>;

  return (
    <>
      <div className="header">
        <h1>Agents</h1>
        <p>Annuaire des agents rattachés aux services</p>
      </div>

      {error && <div className="alert error" style={{ marginTop: 20 }}>{error}</div>}

      <div className="table-wrap" style={{ marginTop: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Nom</th>
              <th>Fonction</th>
              <th>Service</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id}>
                <td><span className="badge">{a.matricule}</span></td>
                <td>{a.nom}</td>
                <td>{a.fonction || '—'}</td>
                <td>{a.service_nom || '—'}</td>
                <td><span className={a.actif ? 'badge' : 'badge muted'}>{a.actif ? 'Actif' : 'Inactif'}</span></td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr><td colSpan={5} style={{ color: 'var(--ivory-dim)' }}>Aucun agent enregistré.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
