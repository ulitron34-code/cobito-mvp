export type User = {
  id: string;
  email: string;
  empresa: string;
  plan: string;
};

export type Cliente = {
  id: string;
  nombre: string;
  rfc?: string;
  email?: string;
  telefono?: string;
  notas?: string;
  facturas?: number;
  saldo_pendiente?: number;
};

export type Factura = {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  folio?: string;
  monto: number;
  moneda: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  concepto?: string;
  estado: 'PENDIENTE' | 'VENCIDA' | 'PROMESA' | 'PAGADA' | 'CANCELADA';
  email?: string;
  telefono?: string;
  pagado?: number;
};

export type Metrics = {
  total_vencido: number;
  total_promesa: number;
  total_cobrado: number;
  total_facturado: number;
  facturas_total: number;
  facturas_pagadas: number;
  facturas_vencidas: number;
  tasa_recuperacion: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('cobito_token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Error de API');
  }

  return data as T;
}

export function saveSession(token: string, user: User) {
  window.localStorage.setItem('cobito_token', token);
  window.localStorage.setItem('cobito_user', JSON.stringify(user));
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem('cobito_user');
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  window.localStorage.removeItem('cobito_token');
  window.localStorage.removeItem('cobito_user');
}
