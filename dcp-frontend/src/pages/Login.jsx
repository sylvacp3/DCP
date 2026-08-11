import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@tresor.mg');
  const [motDePasse, setMotDePasse] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(email, motDePasse);
      navigate('/');
    } catch {
      // l'erreur est déjà exposée via le contexte
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand">
          <div className="brand-mark"><span>DCP</span></div>
        </div>
        <h1>Trésor Madagascar</h1>
        <p className="sub">Gestion de matériel — Connexion</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Email</label>
            <input
              className="input-box"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Mot de passe</label>
            <input
              className="input-box"
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
            />
          </div>
          <button className="validate-btn" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
