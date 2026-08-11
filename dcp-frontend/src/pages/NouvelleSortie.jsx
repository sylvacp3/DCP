import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

function fmt(n) {
  return Number(n).toLocaleString('fr-FR').replace(/,/g, ' ') + ' Ar';
}

export default function NouvelleSortie() {
  const [materiels, setMateriels] = useState([]);
  const [services, setServices] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({}); // { materiel_id: { ...materiel, qty } }
  const [beneficiaire, setBeneficiaire] = useState(''); // "service:1" | "agent:3"
  const [movement, setMovement] = useState('definitive');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [m, s, a] = await Promise.all([
        api.get('/materiels'),
        api.get('/services'),
        api.get('/agents'),
      ]);
      setMateriels(m);
      setServices(s);
      setAgents(a);
      if (s[0]) setBeneficiaire(`service:${s[0].id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const filtered = useMemo(() => {
    const f = search.trim().toLowerCase();
    if (!f) return materiels;
    return materiels.filter(
      (m) => m.nom.toLowerCase().includes(f) || m.code_inventaire.toLowerCase().includes(f)
    );
  }, [materiels, search]);

  function addToCart(materiel) {
    if (materiel.stock_disponible <= 0) return;
    setCart((prev) => {
      const existing = prev[materiel.id];
      const qty = Math.min((existing?.qty || 0) + 1, materiel.stock_disponible);
      return { ...prev, [materiel.id]: { ...materiel, qty } };
    });
  }

  function changeQty(id, delta) {
    setCart((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const next = { ...prev };
      const qty = item.qty + delta;
      if (qty <= 0) delete next[id];
      else next[id] = { ...item, qty: Math.min(qty, item.stock_disponible) };
      return next;
    });
  }

  function removeItem(id) {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const items = Object.values(cart);
  const total = items.reduce((s, i) => s + i.qty * Number(i.valeur_unitaire), 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  async function handleValider() {
    if (items.length === 0 || !beneficiaire) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const [type, id] = beneficiaire.split(':');
    const payload = {
      type_mouvement: movement,
      lignes: items.map((i) => ({ materiel_id: i.id, quantite: i.qty })),
      ...(type === 'service' ? { service_id: Number(id) } : { agent_id: Number(id) }),
    };

    try {
      const sortie = await api.post('/sorties', payload);
      setSuccess(`Bordereau ${sortie.numero_bordereau} validé.`);
      setCart({});
      await loadAll(); // rafraîchit les stocks
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading-state">Chargement des matériels...</div>;

  return (
    <>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Nouvelle sortie de matériel</h1>
          <p>Affectation définitive ou prêt temporaire vers un agent ou un service</p>
        </div>
        <Link to="/sorties/historique" style={{ color: 'var(--ivory-dim)', fontSize: 13, textDecoration: 'none' }}>
          Voir l'historique →
        </Link>
      </div>

      <div className="content-grid">
        <div className="left-col">
          <div className="search-wrap">
            <input
              type="text"
              placeholder="Rechercher un matériel, un code d'inventaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {error && <div className="alert error">{error}</div>}

          <div className="cards">
            {filtered.map((m) => (
              <div
                key={m.id}
                className={`card${m.stock_disponible <= 0 ? ' disabled' : ''}`}
                onClick={() => addToCart(m)}
              >
                <div className="card-top">
                  <div className="card-icon">▣</div>
                  <div className="tag">{m.code_inventaire}</div>
                </div>
                <div className="card-name">{m.nom}</div>
                <div className={`card-meta${m.stock_disponible <= m.seuil_alerte ? ' low' : ''}`}>
                  {m.stock_disponible} {m.unite}{m.stock_disponible > 1 ? 's' : ''} disponible
                  {m.stock_disponible > 1 ? 's' : ''}
                </div>
                <div className="card-value">{fmt(m.valeur_unitaire)}</div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="cart-empty" style={{ gridColumn: '1/-1' }}>
                Aucun matériel trouvé.
              </div>
            )}
          </div>
        </div>

        <div className="right-col">
          <div className="panel">
            <div className="panel-head">
              <h2>Bordereau de sortie</h2>
              <span>{itemCount} article(s)</span>
            </div>

            {success && <div className="alert success">{success}</div>}

            <div className="field-label">Agent / Service bénéficiaire</div>
            <select
              className="select-box"
              value={beneficiaire}
              onChange={(e) => setBeneficiaire(e.target.value)}
            >
              <optgroup label="Services">
                {services.map((s) => (
                  <option key={`s-${s.id}`} value={`service:${s.id}`}>{s.nom}</option>
                ))}
              </optgroup>
              <optgroup label="Agents">
                {agents.map((a) => (
                  <option key={`a-${a.id}`} value={`agent:${a.id}`}>
                    {a.nom} — {a.matricule}
                  </option>
                ))}
              </optgroup>
            </select>

            {items.length === 0 ? (
              <div className="cart-empty">
                <span className="ic">▢</span>
                Aucun matériel sélectionné.<br />Cliquez sur un article à gauche.
              </div>
            ) : (
              <div>
                {items.map((i) => (
                  <div className="cart-item" key={i.id}>
                    <div className="cart-item-top">
                      <div>
                        <div className="cart-item-name">{i.nom}</div>
                        <div className="cart-item-sub">{i.code_inventaire}</div>
                      </div>
                      <div className="remove-x" onClick={() => removeItem(i.id)}>✕</div>
                    </div>
                    <div className="qty-row">
                      <div className="qty-controls">
                        <button onClick={() => changeQty(i.id, -1)}>−</button>
                        <div className="q">{i.qty}</div>
                        <button onClick={() => changeQty(i.id, 1)}>+</button>
                      </div>
                      <div className="cart-item-val">{fmt(i.qty * i.valeur_unitaire)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="movement-row">
              <div className="field-label">Type de mouvement</div>
              <div className="movement-opts">
                <div
                  className={`radio-opt${movement === 'definitive' ? ' sel' : ''}`}
                  onClick={() => setMovement('definitive')}
                >
                  <span className="radio-dot" /> Affectation définitive
                </div>
                <div
                  className={`radio-opt${movement === 'temporaire' ? ' sel' : ''}`}
                  onClick={() => setMovement('temporaire')}
                >
                  <span className="radio-dot" /> Prêt temporaire
                </div>
              </div>
            </div>

            <div className="total-row">
              <span className="lbl">Valeur totale</span>
              <span className="val">{fmt(total)}</span>
            </div>

            <button
              className="validate-btn"
              disabled={items.length === 0 || submitting || !beneficiaire}
              onClick={handleValider}
            >
              {submitting ? 'Validation...' : '✓ Valider la sortie'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
