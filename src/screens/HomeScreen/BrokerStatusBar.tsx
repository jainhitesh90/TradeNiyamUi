import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, api, endpoints, updateBrokerConnection } from '@/api';
import { useToast } from '@/components';
import { BrokerStatus } from '@/screens/HomeScreen/BrokerStatus';

type BrokerConnection = 'CONNECTED' | 'DISCONNECTED';

type BrokerMapping = {
  brokerId: string;
  brokerStatus: BrokerConnection;
};

type User = {
  brokerMapping: BrokerMapping | null;
};

export function BrokerStatusBar() {
  const toast = useToast();
  const [disconnected, setDisconnected] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setDisconnected(false);

      api
        .get<User>(endpoints.user)
        .then((data) => {
          if (cancelled) {
            return;
          }
          const mapping = data.brokerMapping;
          const brokerStatus = mapping?.brokerStatus === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED';
          updateBrokerConnection({
            brokerId: mapping?.brokerId ?? null,
            brokerStatus,
          });
          setDisconnected(brokerStatus === 'DISCONNECTED');
        })
        .catch((err: unknown) => {
          if (cancelled) {
            return;
          }
          if (err instanceof ApiError) {
            toast.show(err.message);
            return;
          }
          toast.show(err instanceof Error ? err.message : 'Request failed');
        });

      return () => {
        cancelled = true;
      };
    }, [toast]),
  );

  if (!disconnected) {
    return null;
  }

  return (
    <BrokerStatus message="No broker connected" actionLabel="Connect" onAction={() => router.push('/connect-broker')} />
  );
}
