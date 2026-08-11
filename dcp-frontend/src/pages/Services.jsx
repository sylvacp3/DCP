import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/services')
      .then(setServices)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Chargement...</div>;

  return (
    <>
      <div className="header">
        <h1>Services</h1>
        <p>Structures bénéficiaires du Trésor</p>
      </div>

      {error && <div className="alert error" style={{ marginTop: 20 }}>{error}</div>}

      <div className="table-wrap" style={{ marginTop: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Localisation</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td><span className="badge">{s.code}</span></td>
                <td>{s.nom}</td>
                <td>{s.localisation || '—'}</td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr><td colSpan={3} style={{ color: 'var(--ivory-dim)' }}>Aucun service enregistré.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
