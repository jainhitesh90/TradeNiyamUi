import { useEffect, useState } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';

import { ApiError, api, endpoints, readAuthSession, updateBrokerConnection, type BrokerConnection } from '@/api';
import { openInBrowser } from '@/browser/openInBrowser';
import { CustomButton } from '@/components/CustomButton';
import { CustomText } from '@/components/CustomText';
import { GrowwConnectModal } from '@/components/GrowwConnectModal';
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

type BrokerMapping = {
  brokerId?: string;
  brokerStatus: BrokerConnection | string;
};

type User = {
  brokerMapping: BrokerMapping | null;
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
  const [brokerMapping, setBrokerMapping] = useState<BrokerMapping | null>(null);
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
        const mapping = data.brokerMapping ?? null;
        const brokerStatus: BrokerConnection = mapping?.brokerStatus === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED';
        const next = {
          brokerId: mapping?.brokerId ?? null,
          brokerStatus,
        };
        updateBrokerConnection(next);
        setBrokerMapping(mapping);
        setConnection(readAuthSession());
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  function openBroker(broker: Broker) {
    if (broker.brokerName.trim().toLowerCase() === 'groww') {
      setGrowwBroker(broker);
      return;
    }
    if (broker.brokerLinkUrl) {
      openInBrowser(broker.brokerLinkUrl);
    }
  }

  async function disconnectBroker() {
    if (disconnecting) {
      return;
    }

    setDisconnecting(true);
    try {
      await api.post(endpoints.markBrokerAsDisconnected, {}, {
        headers: { Accept: '*/*' },
      });
      updateBrokerConnection({
        brokerId: connection?.brokerId ?? null,
        brokerStatus: 'DISCONNECTED',
      });
      setBrokerMapping((current) => (current ? { ...current, brokerStatus: 'DISCONNECTED' } : current));
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
          const connected = isConnectedBroker(broker, connection?.brokerId, connection?.brokerStatus);
          return (
            <View
              key={broker.brokerId}
              style={[styles.cell, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              {logo ? (
                <Image accessibilityLabel={broker.brokerName} source={logo} style={styles.logo} />
              ) : null}
              <CustomText id={`broker-${broker.brokerId}-name`} variant="label">
                {broker.brokerName}
              </CustomText>
              <CustomButton
                id={`broker-${broker.brokerId}-action`}
                label={connected ? 'Disconnect' : 'Connect'}
                variant="link"
                loading={connected && disconnecting}
                onPress={() => {
                  if (connected) {
                    void disconnectBroker();
                    return;
                  }
                  openBroker(broker);
                }}
              />
            </View>
          );
        })}
      </View>
      <GrowwConnectModal
        visible={growwBroker != null}
        brokerLinkUrl={growwBroker?.brokerLinkUrl ?? ''}
        brokerMapping={brokerMapping}
        onDismiss={() => setGrowwBroker(null)}
      />
    </Screen>
  );
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
