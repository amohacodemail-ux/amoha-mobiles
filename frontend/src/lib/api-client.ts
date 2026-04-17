import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;

const normalizeApiUrl = (value?: string) => {
  // Always use relative /api path - let Next.js rewrites handle proxying to the backend
  return '/api';
};

const API_URL = normalizeApiUrl(rawApiUrl);

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string | null> | null = null;

const isUsableToken = (value?: string) => {
  return !!value && value !== 'undefined' && value !== 'null';
};

const clearAuthCookies = () => {
  Cookies.remove('token');
  Cookies.remove('refresh_token');
};

const shouldSkipRefresh = (url?: string) => {
  if (!url) return false;
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh-token');
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = Cookies.get('refresh_token');
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

  Cookies.set('token', nextAccessToken, { expires: 30, sameSite: 'lax' });
  if (nextRefreshToken) {
    Cookies.set('refresh_token', nextRefreshToken, { expires: 30, sameSite: 'lax' });
  }

  return nextAccessToken;
};

// Request interceptor – attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor – handle 401 & retry transient errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number }) | undefined;

    // Retry transient network/server errors once (502, 503, 504, network error)
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

      const hadToken = !!Cookies.get('token');
      clearAuthCookies();
      // Sync auth store so UI reflects logout state
      if (typeof window !== 'undefined') {
        try {
          // Dynamically import to avoid circular dependency
          const { useAuthStore } = await import('@/store/auth.store');
          useAuthStore.getState().logout();
        } catch {}
      }
      if (hadToken && typeof window !== 'undefined') {
        const publicPaths = ['/', '/products', '/product', '/categories', '/category', '/shop', '/search', '/compare'];
        const currentPath = window.location.pathname;
        const isPublicPage = publicPaths.some(
          (p) => currentPath === p || (p !== '/' && currentPath.startsWith(p + '/')),
        );
        if (!isPublicPage) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
