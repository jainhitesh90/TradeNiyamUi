import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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
let generation = 0;
let restored: Promise<AuthSession | null> | null = null;

function normalizeBrokerStatus(value: unknown): BrokerConnection | null {
  return value === 'CONNECTED' || value === 'DISCONNECTED' ? value : null;
}

function storage(): Storage | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  return sessionStorage;
}

function parseSession(raw: string): AuthSession | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (typeof parsed.token !== 'string' || !parsed.token) {
      return null;
    }
    return {
      token: parsed.token,
      name: typeof parsed.name === 'string' ? parsed.name : null,
      emailId: typeof parsed.emailId === 'string' ? parsed.emailId : null,
      brokerId: typeof parsed.brokerId === 'string' ? parsed.brokerId : null,
      brokerStatus: normalizeBrokerStatus(parsed.brokerStatus),
    };
  } catch {
    return null;
  }
}

function toSession(session: AuthSession): AuthSession {
  return {
    token: session.token,
    name: session.name ?? null,
    emailId: session.emailId ?? null,
    brokerId: session.brokerId ?? null,
    brokerStatus: normalizeBrokerStatus(session.brokerStatus),
  };
}

async function readPersisted(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return storage()?.getItem(AUTH_SESSION_KEY) ?? null;
  }
  return SecureStore.getItemAsync(AUTH_SESSION_KEY);
}

async function writePersisted(raw: string): Promise<void> {
  if (Platform.OS === 'web') {
    storage()?.setItem(AUTH_SESSION_KEY, raw);
    return;
  }
  await SecureStore.setItemAsync(AUTH_SESSION_KEY, raw);
}

async function deletePersisted(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    return;
  }
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  generation += 1;
  memorySession = toSession(session);
  restored = Promise.resolve(memorySession);
  await writePersisted(JSON.stringify(memorySession));
}

export function updateBrokerConnection(connection: {
  brokerId: string | null;
  brokerStatus: BrokerConnection | null;
}): void {
  const current = readAuthSession();
  if (!current) {
    return;
  }
  void saveAuthSession({ ...current, ...connection });
}

export async function clearAuthSession(): Promise<void> {
  generation += 1;
  memorySession = null;
  restored = Promise.resolve(null);
  await deletePersisted();
}

export function restoreAuthSession(): Promise<AuthSession | null> {
  if (memorySession?.token) {
    return Promise.resolve(memorySession);
  }
  if (!restored) {
    const started = generation;
    restored = readPersisted()
      .then((raw) => {
        if (started !== generation) {
          return memorySession;
        }
        memorySession = raw ? parseSession(raw) : null;
        return memorySession;
      })
      .catch((error: unknown) => {
        if (started === generation) {
          restored = null;
        }
        throw error;
      });
  }
  return restored;
}

export function readAuthSession(): AuthSession | null {
  if (memorySession?.token) {
    return memorySession;
  }

  if (Platform.OS !== 'web') {
    return null;
  }

  const raw = storage()?.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  memorySession = parseSession(raw);
  return memorySession;
}
