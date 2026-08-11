import { useEffect, useState } from 'react';
import { api } from '../api/client';

function fmt(n) {
  return Number(n).toLocaleString('fr-FR').replace(/,/g, ' ') + ' Ar';
}

export default function Materiels() {
  const [materiels, setMateriels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/materiels')
      .then(setMateriels)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Chargement...</div>;

  return (
    <>
      <div className="header">
        <h1>Matériels</h1>
        <p>Catalogue et stock disponible</p>
      </div>

      {error && <div className="alert error" style={{ marginTop: 20 }}>{error}</div>}

      <div className="table-wrap" style={{ marginTop: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Catégorie</th>
              <th>Stock disponible</th>
              <th>Stock total</th>
              <th>Valeur unitaire</th>
            </tr>
          </thead>
          <tbody>
            {materiels.map((m) => (
              <tr key={m.id}>
                <td><span className="badge">{m.code_inventaire}</span></td>
                <td>{m.nom}</td>
                <td>{m.categorie_nom || '—'}</td>
                <td>
                  <span className={m.stock_disponible <= m.seuil_alerte ? 'badge' : 'badge muted'}
                        style={m.stock_disponible <= m.seuil_alerte ? { background: 'rgba(200,16,46,0.14)', color: '#FF9BA8' } : {}}>
                    {m.stock_disponible} {m.unite}{m.stock_disponible > 1 ? 's' : ''}
                  </span>
                </td>
                <td>{m.stock_total}</td>
                <td>{fmt(m.valeur_unitaire)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
