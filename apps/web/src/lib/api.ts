import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth.store';

const BASE_URL = '/api/v1';

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,  // send httpOnly refresh cookie
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  // ── Request interceptor: attach access token ──────────────────────
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // ── Response interceptor: refresh token on 401 ───────────────────
  let refreshing = false;
  let refreshQueue: Array<(token: string) => void> = [];

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as any;

      if (error.response?.status !== 401 || original._retry) {
        return Promise.reject(error);
      }

      // Skip refresh for auth endpoints themselves
      if (original.url?.includes('/auth/')) {
        return Promise.reject(error);
      }

      original._retry = true;

      if (refreshing) {
        // Queue requests while refresh is in progress
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(client(original));
          });
        });
      }

      refreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.data.accessToken as string;
        useAuthStore.getState().setAccessToken(newToken);

        // Flush queue
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];

        original.headers.Authorization = `Bearer ${newToken}`;
        return client(original);
      } catch {
        // Refresh failed — log out
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        refreshing = false;
      }
    }
  );

  return client;
}

export const api = createClient();

// ─── Typed API helpers ────────────────────────────────────────────────────────
function formatApiResponse<T>(payload: any): T {
  if (!payload || typeof payload !== 'object') return payload as T;
  
  const inner = payload.data !== undefined ? payload.data : payload;
  if (Array.isArray(inner)) {
    const arr: any = [...inner];
    arr.data = inner;
    if (payload.products) arr.products = payload.products;
    if (payload.purchaseOrders) arr.purchaseOrders = payload.purchaseOrders;
    if (payload.suppliers) arr.suppliers = payload.suppliers;
    if (payload.warehouses) arr.warehouses = payload.warehouses;
    return arr as T;
  }
  
  if (typeof inner === 'object') {
    return { ...payload, ...inner } as T;
  }
  
  return inner as T;
}

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<any>(url, { params });
  return formatApiResponse<T>(data);
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<any>(url, body);
  return formatApiResponse<T>(data);
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<any>(url, body);
  return formatApiResponse<T>(data);
}

export async function del<T = void>(url: string): Promise<T> {
  const { data } = await api.delete<any>(url);
  return formatApiResponse<T>(data);
}
