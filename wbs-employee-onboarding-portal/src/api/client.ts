import type {
  ActivationRequest, ActivationResponse, AuthMeResponse, EmployeeListResponse,
  EmployeeResponse, InvitationValidation, LoginRequest, NewEmployeeRequest,
  OnboardingCreated, ApiErrorBody,
} from './types';

const configuredBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
const API_BASE = configuredBase.replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fieldErrors?: Record<string, string>,
  ) { super(message); this.name = 'ApiError'; }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    let body: unknown = null;
    const raw = await response.text();
    if (raw) {
      try { body = JSON.parse(raw); }
      catch { throw new ApiError('Ungültige Serverantwort. Bitte wenden Sie sich an den Support.', response.status, 'INVALID_JSON'); }
    }
    if (!response.ok) {
      const data = (body && typeof body === 'object' ? body : {}) as ApiErrorBody;
      const err = typeof data.error === 'object' && data.error !== null ? data.error : undefined;
      const code = err?.code ?? (typeof data.error === 'string' ? data.error : undefined);
      const fallback = response.status === 401 ? 'Anmeldung erforderlich oder Sitzung abgelaufen.'
        : response.status === 403 ? 'Keine Berechtigung für diesen Vorgang.'
        : response.status === 409 ? 'Dieser Vorgang steht im Konflikt mit vorhandenen Daten.'
        : response.status === 429 ? 'Zu viele Anfragen. Bitte später erneut versuchen.'
        : 'Der Server konnte die Anfrage nicht verarbeiten.';
      throw new ApiError(err?.message || data.message || fallback, response.status, code, err?.field_errors);
    }
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError')
      throw new ApiError('Zeitüberschreitung. Bitte prüfen Sie die Verbindung.', 0, 'TIMEOUT');
    throw new ApiError('Backend nicht erreichbar. Bitte Verbindung und API-Konfiguration prüfen.', 0, 'NETWORK_ERROR');
  } finally { window.clearTimeout(timer); }
}

const json = (data: unknown): string => JSON.stringify(data);

export const api = {
  createOnboarding: (data: NewEmployeeRequest, key: string) => request<OnboardingCreated>('/onboarding', {
    method: 'POST', body: json(data), headers: { 'Idempotency-Key': key },
  }),
  listEmployees: () => request<EmployeeListResponse>('/hr/employees'),
  getEmployee: (id: string) => request<EmployeeResponse>(`/hr/employees/${encodeURIComponent(id)}`),
  approveEmployee: (id: string) => request<EmployeeResponse | void>(`/hr/employees/${encodeURIComponent(id)}/approve`, { method: 'POST' }),
  sendInvitation: (id: string) => request<EmployeeResponse | void>(`/hr/employees/${encodeURIComponent(id)}/send-invitation`, { method: 'POST' }),
  validateInvitation: (token: string) => request<InvitationValidation>(`/invitations/validate?token=${encodeURIComponent(token)}`),
  activate: (data: ActivationRequest) => request<ActivationResponse>('/invitations/activate', { method: 'POST', body: json(data) }),
  login: (data: LoginRequest) => request<void>('/auth/login', { method: 'POST', body: json(data) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<AuthMeResponse>('/auth/me'),
};

export function apiMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.';
}
