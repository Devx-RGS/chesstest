import axios from 'axios';
import { API_BASE_URL } from './constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    isAdmin: boolean;
  };
  coinAwarded?: boolean;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
}

export function getStoredUser() {
  const raw = localStorage.getItem('decaychess_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('decaychess_token');
}

export function storeAuth(token: string, user: LoginResponse['user']) {
  localStorage.setItem('decaychess_token', token);
  localStorage.setItem('decaychess_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('decaychess_token');
  localStorage.removeItem('decaychess_user');
}
