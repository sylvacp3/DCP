const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('dcp_token');
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Session expirée ou invalide → on force la déconnexion
  if (res.status === 401) {
    localStorage.removeItem('dcp_token');
    localStorage.removeItem('dcp_user');
    window.location.href = '/login';
    throw new Error('Session expirée, veuillez vous reconnecter.');
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.message || `Erreur ${res.status}`);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};
