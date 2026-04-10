import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { TokenStore } from '../storage/secure-store';

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach access token ──────────────────────────────────────────────
http.interceptors.request.use(async (config) => {
  const token = await TokenStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: handle 401 → refresh token ─────────────────────────────────────
http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await TokenStore.getRefreshToken();
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        await TokenStore.setTokens(data.data.accessToken, data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return http(original);
      } catch {
        await TokenStore.clearTokens();
      }
    }

    return Promise.reject(error);
  },
);

export default http;
