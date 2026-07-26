import router from '../router';
import { useAuthStore } from '../stores/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const authStore = auth ? useAuthStore() : null;
  if (authStore?.token) headers['Authorization'] = `Bearer ${authStore.token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Network error - could not reach server', 0);
  }

  if (response.status === 401) {
    if (auth) {
      useAuthStore().clearSession();
      if (router.currentRoute.value.name !== 'login') {
        router.push({ name: 'login' });
      }
    }
    let msg = 'Unauthorized';
    try {
      msg = (await response.json())?.message || msg;
    } catch {
      // no body
    }
    throw new ApiError(msg, 401);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // empty body, e.g. 204
  }

  if (!response.ok) {
    throw new ApiError(data?.message || `Request failed (${response.status})`, response.status);
  }

  return data;
}

export const api = {
  login: (username, password) =>
    request('/login', { method: 'POST', body: { username, password }, auth: false }),
  logout: () => request('/logout', { method: 'POST' }),
  getStatus: () => request('/status'),
  control: (action) => request('/control', { method: 'POST', body: { action } }),
  getLogs: () => request('/logs'),
};
