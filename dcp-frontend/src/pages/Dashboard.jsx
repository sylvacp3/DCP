import { useEffect, useState } from 'react';
import { api } from '../api/client';

function fmt(n) {
  return Number(n).toLocaleString('fr-FR').replace(/,/g, ' ') + ' Ar';
}

export default function Dashboard() {
  const [materiels, setMateriels] = useState([]);
  const [sorties, setSorties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/materiels'), api.get('/sorties')])
      .then(([m, s]) => { setMateriels(m); setSorties(s); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Chargement...</div>;

  const valeurStock = materiels.reduce((s, m) => s + m.stock_disponible * Number(m.valeur_unitaire), 0);
  const alertes = materiels.filter((m) => m.stock_disponible <= m.seuil_alerte);
  const sortiesValidees = sorties.filter((s) => s.statut === 'validee');

  const kpis = [
    { label: 'Références matériel', value: materiels.length },
    { label: 'Valeur du stock disponible', value: fmt(valeurStock) },
    { label: 'Bordereaux validés', value: sortiesValidees.length },
    { label: 'Alertes stock bas', value: alertes.length },
  ];

  return (
    <>
      <div className="header">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble du parc matériel — DCP Trésor Madagascar</p>
      </div>

      <div className="cards" style={{ marginTop: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {kpis.map((k) => (
          <div className="card" key={k.label} style={{ cursor: 'default' }}>
            <div className="card-meta">{k.label}</div>
            <div className="card-value" style={{ fontSize: 20, marginTop: 8 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {alertes.length > 0 && (
        <div className="table-wrap" style={{ marginTop: 26 }}>
          <table>
            <thead>
              <tr><th>Code</th><th>Matériel</th><th>Stock disponible</th><th>Seuil d'alerte</th></tr>
            </thead>
            <tbody>
              {alertes.map((m) => (
                <tr key={m.id}>
                  <td><span className="badge">{m.code_inventaire}</span></td>
                  <td>{m.nom}</td>
                  <td style={{ color: 'var(--red)' }}>{m.stock_disponible}</td>
                  <td>{m.seuil_alerte}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
