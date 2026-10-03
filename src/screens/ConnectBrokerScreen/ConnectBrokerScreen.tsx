import { useEffect, useState } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';

import {
  ApiError,
  api,
  brokerMappingsFrom,
  connectedBrokerMapping,
  endpoints,
  isConnectedStatus,
  readAuthSession,
  updateBrokerConnection,
  type BrokerConnection,
  type BrokerMappingEntry,
} from '@/api';
import { openInBrowser } from '@/browser/openInBrowser';
import { CustomButton } from '@/components/CustomButton';
import { CustomText } from '@/components/CustomText';
import { GrowwConnectModal } from '@/components/GrowwConnectModal';
import { UpstoxConnectModal } from '@/components/UpstoxConnectModal';
import { Loader } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/AppToast';
import { styles } from '@/screens/ConnectBrokerScreen/styles';
import { useTheme } from '@/theme';

type Broker = {
  brokerId: string;
  brokerName: string;
  brokerLinkUrl: string;
};

type User = {
  brokerMapping?: unknown;
  userBrokerMapping?: unknown;
  user_broker_mapping?: unknown;
};

const brokerLogos: Record<string, ImageSourcePropType> = {
  groww: require('../../../assets/images/groww.png'),
  upstox: require('../../../assets/images/upstox.jpeg'),
};

export function ConnectBrokerScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [growwBroker, setGrowwBroker] = useState<Broker | null>(null);
  const [upstoxBroker, setUpstoxBroker] = useState<Broker | null>(null);
  const [brokerMappings, setBrokerMappings] = useState<BrokerMappingEntry[] | null>(null);
  const [connection, setConnection] = useState(() => readAuthSession());

  useEffect(() => {
    let cancelled = false;

    api
      .get<Broker[]>(endpoints.brokers)
      .then((data) => {
        if (!cancelled) {
          setBrokers(Array.isArray(data) ? data : []);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError) {
          setError(err.message);
          return;
        }
        setError(err instanceof Error ? err.message : 'Request failed');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    api
      .get<User>(endpoints.user)
      .then((data) => {
        if (cancelled) {
          return;
        }
        const mappings = brokerMappingsFrom(data);
        const connected = connectedBrokerMapping(mappings);
        updateBrokerConnection({
          brokerId: connected?.brokerId ?? null,
          brokerStatus: connected ? 'CONNECTED' : 'DISCONNECTED',
        });
        setBrokerMappings(mappings);
        setConnection(readAuthSession());
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  function openBroker(broker: Broker) {
    const name = broker.brokerName.trim().toLowerCase();
    if (name === 'groww') {
      setGrowwBroker(broker);
      return;
    }
    if (name === 'upstox') {
      setUpstoxBroker(broker);
      return;
    }
    if (broker.brokerLinkUrl) {
      openInBrowser(broker.brokerLinkUrl);
    }
  }

  async function disconnectBroker(brokerId: string) {
    if (disconnecting || !brokerId) {
      return;
    }

    setDisconnecting(true);
    try {
      await api.post(endpoints.markBrokerAsDisconnected, { brokerId }, {
        headers: { Accept: '*/*' },
      });
      updateBrokerConnection({
        brokerId: connection?.brokerId ?? null,
        brokerStatus: 'DISCONNECTED',
      });
      setBrokerMappings((current) =>
        current?.map((entry) =>
          isConnectedStatus(entry.brokerStatus) ? { ...entry, brokerStatus: 'DISCONNECTED' } : entry,
        ) ?? current,
      );
      setConnection(readAuthSession());
    } catch (err: unknown) {
      const message = err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Request failed';
      toast.show(message);
    } finally {
      setDisconnecting(false);
    }
  }

  const activeBrokerId = connectedBrokerId(brokerMappings, connection);

  return (
    <Screen style={styles.container}>
      <CustomText id="connect-broker-title" variant="large" style={styles.title}>
        Brokers
      </CustomText>
      {loading ? <Loader /> : null}
      {error ? (
        <CustomText id="connect-broker-error" variant="error" style={styles.error}>
          {error}
        </CustomText>
      ) : null}
      {!loading && !error && brokers.length === 0 ? (
        <CustomText id="connect-broker-empty" variant="small">
          No brokers
        </CustomText>
      ) : null}
      <View style={styles.grid}>
        {brokers.map((broker) => {
          const logo = brokerLogos[broker.brokerName.trim().toLowerCase()];
          const connected = isConnectedBroker(broker, activeBrokerId, activeBrokerId ? 'CONNECTED' : null);
          const locked = activeBrokerId != null && !connected;
          return (
            <View
              key={broker.brokerId}
              pointerEvents={locked ? 'none' : 'auto'}
              accessibilityState={{ disabled: locked }}
              style={[
                styles.cell,
                { backgroundColor: colors.background, borderColor: colors.border },
                locked && styles.locked,
              ]}
            >
              {logo ? (
                <Image accessibilityLabel={broker.brokerName} source={logo} style={styles.logo} />
              ) : null}
              <CustomText
                id={`broker-${broker.brokerId}-name`}
                variant="label"
                style={locked ? { color: colors.textDim } : undefined}
              >
                {broker.brokerName}
              </CustomText>
              {locked ? null : (
                <CustomButton
                  id={`broker-${broker.brokerId}-action`}
                  label={connected ? 'Disconnect' : 'Connect'}
                  variant="link"
                  loading={connected && disconnecting}
                  onPress={() => {
                    if (connected) {
                      void disconnectBroker(broker.brokerId);
                      return;
                    }
                    openBroker(broker);
                  }}
                />
              )}
            </View>
          );
        })}
      </View>
      <GrowwConnectModal
        visible={growwBroker != null}
        brokerId={growwBroker?.brokerId ?? ''}
        brokerLinkUrl={growwBroker?.brokerLinkUrl ?? ''}
        brokerMappings={brokerMappings ?? []}
        onDismiss={() => setGrowwBroker(null)}
      />
      <UpstoxConnectModal
        visible={upstoxBroker != null}
        brokerId={upstoxBroker?.brokerId ?? ''}
        onDismiss={() => setUpstoxBroker(null)}
        onConnected={(brokerId) => {
          updateBrokerConnection({ brokerId, brokerStatus: 'CONNECTED' });
          setBrokerMappings((current) => markBrokerConnected(current ?? [], brokerId));
          setConnection(readAuthSession());
        }}
      />
    </Screen>
  );
}

function connectedBrokerId(
  mappings: BrokerMappingEntry[] | null,
  session: { brokerId: string | null; brokerStatus: BrokerConnection | null } | null,
): string | null {
  if (mappings) {
    return connectedBrokerMapping(mappings)?.brokerId ?? null;
  }
  if (session?.brokerStatus === 'CONNECTED') {
    return session.brokerId;
  }
  return null;
}

function markBrokerConnected(mappings: BrokerMappingEntry[], brokerId: string): BrokerMappingEntry[] {
  const selectedId = brokerId.trim().toLowerCase();
  let found = false;
  const next = mappings.map((entry) => {
    const entryId = String(entry.brokerId ?? '').trim().toLowerCase();
    if (entryId === selectedId) {
      found = true;
      return { ...entry, brokerId, brokerStatus: 'CONNECTED' };
    }
    if (isConnectedStatus(entry.brokerStatus)) {
      return { ...entry, brokerStatus: 'DISCONNECTED' };
    }
    return entry;
  });
  return found ? next : [...next, { brokerId, brokerStatus: 'CONNECTED' }];
}

function isConnectedBroker(
  broker: Broker,
  brokerId: string | null | undefined,
  brokerStatus: BrokerConnection | null | undefined,
): boolean {
  if (brokerStatus !== 'CONNECTED' || !brokerId) {
    return false;
  }
  const connectedId = brokerId.trim().toLowerCase();
  return (
    broker.brokerId.trim().toLowerCase() === connectedId ||
    broker.brokerName.trim().toLowerCase() === connectedId
  );
}
