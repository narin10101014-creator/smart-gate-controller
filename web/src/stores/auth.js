import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api, ApiError } from '../services/api';

const TOKEN_KEY = 'sgc_token';
const USER_KEY = 'sgc_user';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || null);
  const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'));
  const loginError = ref('');
  const loginRetryAfter = ref(0); // seconds, > 0 only when rate limited
  const isLoggingIn = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  function persist() {
    if (token.value) {
      localStorage.setItem(TOKEN_KEY, token.value);
      localStorage.setItem(USER_KEY, JSON.stringify(user.value));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  async function login(username, password) {
    isLoggingIn.value = true;
    loginError.value = '';
    loginRetryAfter.value = 0;
    try {
      const data = await api.login(username, password);
      token.value = data.token;
      user.value = data.user;
      persist();
      return true;
    } catch (err) {
      loginError.value = err instanceof ApiError ? err.message : 'Login failed';
      if (err instanceof ApiError && err.retryAfter) {
        loginRetryAfter.value = err.retryAfter;
      }
      return false;
    } finally {
      isLoggingIn.value = false;
    }
  }

  async function logout() {
    try {
      await api.logout();
    } catch {
      // best-effort: clear local state below even if the call fails
    } finally {
      clearSession();
    }
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    persist();
  }

  return { token, user, loginError, loginRetryAfter, isLoggingIn, isAuthenticated, login, logout, clearSession };
});
