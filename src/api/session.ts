export type BrokerConnection = 'CONNECTED' | 'DISCONNECTED';

export type AuthSession = {
  token: string;
  name: string | null;
  emailId: string | null;
  brokerId: string | null;
  brokerStatus: BrokerConnection | null;
};

const AUTH_SESSION_KEY = 'auth';

let memorySession: AuthSession | null = null;

function normalizeBrokerStatus(value: unknown): BrokerConnection | null {
  return value === 'CONNECTED' || value === 'DISCONNECTED' ? value : null;
}

function storage(): Storage | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  return sessionStorage;
}

export function saveAuthSession(session: AuthSession): void {
  memorySession = {
    token: session.token,
    name: session.name ?? null,
    emailId: session.emailId ?? null,
    brokerId: session.brokerId ?? null,
    brokerStatus: normalizeBrokerStatus(session.brokerStatus),
  };
  storage()?.setItem(AUTH_SESSION_KEY, JSON.stringify(memorySession));
}

export function updateBrokerConnection(connection: {
  brokerId: string | null;
  brokerStatus: BrokerConnection | null;
}): void {
  const current = readAuthSession();
  if (!current) {
    return;
  }
  saveAuthSession({ ...current, ...connection });
}

export function clearAuthSession(): void {
  memorySession = null;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
}

export function readAuthSession(): AuthSession | null {
  if (memorySession?.token) {
    return memorySession;
  }

  const raw = storage()?.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (typeof parsed.token !== 'string' || !parsed.token) {
      return null;
    }
    memorySession = {
      token: parsed.token,
      name: typeof parsed.name === 'string' ? parsed.name : null,
      emailId: typeof parsed.emailId === 'string' ? parsed.emailId : null,
      brokerId: typeof parsed.brokerId === 'string' ? parsed.brokerId : null,
      brokerStatus: normalizeBrokerStatus(parsed.brokerStatus),
    };
    return memorySession;
  } catch {
    return null;
  }
}
