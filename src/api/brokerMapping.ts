export type BrokerMappingEntry = {
  brokerId?: string | null;
  brokerStatus?: string | null;
  brokerToken?: string | null;
};

type UserWithMappings = {
  brokerMapping?: unknown;
  userBrokerMapping?: unknown;
  user_broker_mapping?: unknown;
};

export function isConnectedStatus(status: unknown): boolean {
  return String(status ?? '').trim().toUpperCase() === 'CONNECTED';
}

export function brokerMappingsFrom(user: UserWithMappings | null | undefined): BrokerMappingEntry[] {
  const raw = user?.user_broker_mapping ?? user?.userBrokerMapping ?? user?.brokerMapping;
  if (Array.isArray(raw)) {
    return raw.filter(isEntry);
  }
  if (isEntry(raw)) {
    return [raw];
  }
  return [];
}

export function connectedBrokerMapping(mappings: BrokerMappingEntry[]): BrokerMappingEntry | null {
  return mappings.find((entry) => isConnectedStatus(entry.brokerStatus)) ?? null;
}

export function brokerMappingFor(
  mappings: BrokerMappingEntry[],
  ...ids: Array<string | null | undefined>
): BrokerMappingEntry | null {
  const wanted = ids
    .map((id) => id?.trim().toLowerCase())
    .filter((id): id is string => Boolean(id));
  if (wanted.length === 0) {
    return null;
  }
  const matches = mappings.filter((entry) =>
    wanted.includes(String(entry.brokerId ?? '').trim().toLowerCase()),
  );
  return matches.find((entry) => isConnectedStatus(entry.brokerStatus)) ?? matches[0] ?? null;
}

function isEntry(value: unknown): value is BrokerMappingEntry {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
