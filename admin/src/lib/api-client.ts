import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;

const normalizeApiUrl = (_value?: string) => {
  // Always use the local /api proxy so browser requests stay same-origin in development.
  return '/api';
};

const API_URL = normalizeApiUrl(rawApiUrl);

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<string | null> | null = null;

const isUsableToken = (value?: string) => {
  return !!value && value !== 'undefined' && value !== 'null';
};

const clearAdminCookies = () => {
  Cookies.remove('admin_token');
  Cookies.remove('admin_refresh_token');
};

const shouldSkipRefresh = (url?: string) => {
  if (!url) return false;
  return url.includes('/auth/login') || url.includes('/auth/refresh-token');
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = Cookies.get('admin_refresh_token');
  if (!isUsableToken(refreshToken)) return null;

  const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {
    refreshToken,
  }, {
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  const nextAccessToken = data?.data?.token as string | undefined;
  const nextRefreshToken = data?.data?.refreshToken as string | undefined;

  if (!nextAccessToken) return null;

  Cookies.set('admin_token', nextAccessToken, { expires: 1, sameSite: 'lax' });
  if (nextRefreshToken) {
    Cookies.set('admin_refresh_token', nextRefreshToken, { expires: 1, sameSite: 'lax' });
  }

  return nextAccessToken;
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let axios set Content-Type automatically for FormData (multipart with boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number }) | undefined;

    // Retry transient network/server errors once for safe methods
    if (originalRequest && !originalRequest._retry) {
      const retryCount = originalRequest._retryCount || 0;
      const status = error.response?.status;
      const isTransient = !status || status === 502 || status === 503 || status === 504;
      if (isTransient && retryCount < 1 && originalRequest.method && ['get', 'head', 'options'].includes(originalRequest.method)) {
        originalRequest._retryCount = retryCount + 1;
        await new Promise((r) => setTimeout(r, 800));
        return apiClient(originalRequest);
      }
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !shouldSkipRefresh(originalRequest.url)) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken();
        }
        const nextAccessToken = await refreshPromise;
        refreshPromise = null;

        if (nextAccessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        refreshPromise = null;
      }

      clearAdminCookies();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
