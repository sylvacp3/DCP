import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { group: 'Général', items: [
    { to: '/', label: 'Tableau de bord', icon: '▦' },
    { to: '/materiels', label: 'Matériels', icon: '▣' },
    { to: '/sorties', label: 'Sorties', icon: '↦' },
  ]},
  { group: 'Annuaire', items: [
    { to: '/agents', label: 'Agents', icon: '◔' },
    { to: '/services', label: 'Services', icon: '◱' },
    { to: '/fournisseurs', label: 'Fournisseurs', icon: '⌂' },
  ]},
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <div className="sidebar">
      <div className="brand">
        <div className="brand-mark"><span>DCP</span></div>
        <div className="brand-text">Trésor Madagascar<small>Gestion de matériel</small></div>
      </div>

      {NAV.map((section) => (
        <div key={section.group}>
          <div className="nav-group-label">{section.group}</div>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              end={item.to === '/'}
            >
              <span className="ic">{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </div>
      ))}

      <div className="sidebar-foot">
        <span className="dot" />
        {user?.nom || 'Utilisateur'}
        <span className="logout-link" onClick={logout} title="Se déconnecter">⏻</span>
      </div>
    </div>
  );
}
