import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ApiError, api, brokerMappingsFrom, connectedBrokerMapping, endpoints } from '@/api';
import { Card, CustomText, Loader, Screen } from '@/components';
import { styles } from '@/screens/ProfileScreen/styles';
import { displayValue } from '@/utils';

type User = {
  userId?: string;
  name: string | null;
  emailId: string | null;
  phoneNo: string | null;
  brokerMapping?: unknown;
  userBrokerMapping?: unknown;
  user_broker_mapping?: unknown;
};

export function ProfileScreen() {
  const [account, setAccount] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get<User>(endpoints.user)
      .then((data) => {
        if (!cancelled) {
          setAccount(data);
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

    return () => {
      cancelled = true;
    };
  }, []);

  const subtitle = account?.name || account?.emailId || 'Account';
  const connectedBroker = connectedBrokerMapping(brokerMappingsFrom(account));

  return (
    <Screen style={styles.container}>
      <CustomText id="profile-title" variant="large">
        Profile
      </CustomText>
      <CustomText id="profile-subtitle" variant="small" style={styles.subtitle}>
        {subtitle}
      </CustomText>
      {loading ? <Loader /> : null}
      {error ? (
        <CustomText id="profile-error" variant="error" style={styles.error}>
          {error}
        </CustomText>
      ) : null}
      {!loading && !error && !account ? (
        <CustomText id="profile-empty" variant="small">
          No profile
        </CustomText>
      ) : null}
      {account ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          <Card>
            <CustomText id="profile-account-title" variant="caption" style={styles.cardTitle}>
              Account
            </CustomText>
            <Field id="profile-name" label="Name" value={displayValue(account.name)} />
            <Field id="profile-email" label="Email" value={displayValue(account.emailId)} />
            <Field id="profile-phone" label="Phone" value={displayValue(account.phoneNo)} />
            <Field id="profile-broker-id" label="Broker ID" value={displayValue(connectedBroker?.brokerId)} />
            <Field id="profile-broker-token" label="Broker token" value={displayValue(connectedBroker?.brokerToken)} />
          </Card>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

function Field({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <View style={styles.field}>
      <CustomText id={`${id}-label`} variant="caption">
        {label}
      </CustomText>
      <CustomText id={`${id}-value`} variant="body" style={styles.fieldValue}>
        {value}
      </CustomText>
    </View>
  );
}
