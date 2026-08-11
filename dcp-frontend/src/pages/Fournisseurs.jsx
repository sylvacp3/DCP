import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/fournisseurs')
      .then(setFournisseurs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Chargement...</div>;

  return (
    <>
      <div className="header">
        <h1>Fournisseurs</h1>
        <p>Partenaires d'approvisionnement</p>
      </div>

      {error && <div className="alert error" style={{ marginTop: 20 }}>{error}</div>}

      <div className="table-wrap" style={{ marginTop: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Contact</th>
              <th>Téléphone</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {fournisseurs.map((f) => (
              <tr key={f.id}>
                <td>{f.nom}</td>
                <td>{f.contact_nom || '—'}</td>
                <td>{f.telephone || '—'}</td>
                <td>{f.email || '—'}</td>
              </tr>
            ))}
            {fournisseurs.length === 0 && (
              <tr><td colSpan={4} style={{ color: 'var(--ivory-dim)' }}>Aucun fournisseur enregistré.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
