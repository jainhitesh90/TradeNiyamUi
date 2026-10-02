import axios from 'axios';

import { readAuthSession } from '@/api/session';

const DEFAULT_BASE_URL = 'http://localhost:3000';
const NGROK_HOST = /(^|\.)ngrok(-free)?\.(app|dev|io)$/i;

export type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type InternalRequestOptions = RequestOptions & {
  method: HttpMethod;
  path: string;
  body?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function joinUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = baseUrl.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

function buildQuery(query: Record<string, QueryValue> | undefined): Record<string, string> {
  const params: Record<string, string> = {};
  if (!query) {
    return params;
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    params[key] = String(value);
  }

  return params;
}

export type ApiResponse<T> = {
  statusCode: number;
  success: boolean;
  data: T;
  message: string | null;
  errorMessage: string | null;
};

function isApiResponse(body: unknown): body is ApiResponse<unknown> {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const record = body as Record<string, unknown>;
  return typeof record.success === 'boolean' && 'data' in record;
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function extractMessage(body: unknown): string | null {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (!body || typeof body !== 'object') {
    return null;
  }

  const record = body as Record<string, unknown>;
  const errorMessage = textOrNull(record.errorMessage);
  if (errorMessage) {
    return errorMessage;
  }

  const message = textOrNull(record.message);
  if (message) {
    return message;
  }

  if (typeof record.errorMsg === 'string' && record.errorMsg.trim()) {
    return record.errorMsg;
  }

  if (record.errorMessage && typeof record.errorMessage === 'object' && 'message' in record.errorMessage) {
    return textOrNull((record.errorMessage as { message: unknown }).message);
  }

  return null;
}

export class ApiClient {
  private accessToken: string | null = null;

  constructor(private readonly baseUrl: string) {}

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'GET', path });
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'POST', path, body });
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'PUT', path, body });
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'PATCH', path, body });
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'DELETE', path });
  }

  async request<T>(options: InternalRequestOptions): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...options.headers,
    };

    if (NGROK_HOST.test(new URL(this.baseUrl).hostname)) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    if (options.body !== undefined && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const params = buildQuery(options.query);

    let status = 0;
    let body: unknown = null;

    try {
      const response = await axios.request({
        url: joinUrl(this.baseUrl, options.path),
        method: options.method,
        headers,
        params,
        data: options.body,
        signal: options.signal,
        validateStatus: () => true,
      });
      status = response.status;
      body = response.data;
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.message : 'Network request failed';
      throw new ApiError(message, 0, null);
    }

    const envelope = isApiResponse(body) ? body : null;
    const failed = status < 200 || status >= 300 || envelope?.success === false;

    if (failed) {
      const message = extractMessage(body) ?? `Request failed with status ${status}`;
      throw new ApiError(message, envelope?.statusCode ?? status, body);
    }

    if (!envelope) {
      throw new ApiError('Unexpected response from server', status, body);
    }

    return envelope.data as T;
  }
}

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;

export const api = new ApiClient(configuredBaseUrl);
api.setAccessToken(readAuthSession()?.token ?? null);
