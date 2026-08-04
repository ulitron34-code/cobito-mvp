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

export type Pago = {
  id: string;
  factura_id: string;
  folio?: string;
  monto: number;
  fecha_pago: string;
  canal?: string;
  referencia?: string;
};

export type Promesa = {
  id: string;
  factura_id: string;
  folio?: string;
  fecha_prometida: string;
  monto: number;
  status: string;
  notas?: string;
};

export type LogComunicacion = {
  id: string;
  factura_id: string;
  folio?: string;
  tipo: string;
  destinatario?: string;
  mensaje?: string;
  resultado?: Record<string, unknown>;
  created_at: string;
};


export type ChatbotMensaje = {
  id: string;
  factura_id?: string;
  folio?: string;
  canal: 'WHATSAPP' | 'EMAIL' | 'SMS' | 'LLAMADA';
  direccion: 'INBOUND' | 'OUTBOUND';
  telefono?: string;
  mensaje: string;
  intencion?: string;
  respuesta?: string;
  created_at: string;
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
  saldo?: number;
};

export type ClienteDetalle = Cliente & {
  facturas_detalle: Factura[];
  pagos: Pago[];
  promesas: Promesa[];
  logs: LogComunicacion[];
  chatbot?: ChatbotMensaje[];
};

export type Metrics = {
  total_vencido: number;
  total_promesa: number;
  total_cobrado: number;
  total_facturado: number;
  saldo_abierto: number;
  facturas_total: number;
  facturas_pagadas: number;
  facturas_vencidas: number;
  tasa_recuperacion: number;
};


export type TemplateMensaje = {
  id: string;
  nombre: string;
  canal: 'WHATSAPP' | 'EMAIL' | 'SMS' | 'LLAMADA';
  contenido: string;
  is_default: boolean;
  created_at?: string;
};
export type AgingBucket = {
  bucket: 'POR_VENCER' | '0_30' | '31_60' | '61_90' | '90_MAS';
  facturas: number;
  saldo: number;
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