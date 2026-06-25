const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
  const token = localStorage.getItem('athletos_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res) => {
  if (!res.ok) {
    const errMsg = await res.text();
    if (res.status === 401 || (res.status === 403 && errMsg.toLowerCase().includes('deactivated'))) {
      localStorage.removeItem('athletos_token');
      window.location.href = '/';
    }
    throw new Error(errMsg || 'API Error');
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
};

export const api = {
  get: async (path) => {
    const res = await fetch(`${API_URL}${path}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  post: async (path, body) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },
  put: async (path, body) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },
  delete: async (path) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};
