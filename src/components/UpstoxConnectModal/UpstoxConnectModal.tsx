import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  ApiError,
  api,
  brokerMappingFor,
  brokerMappingsFrom,
  endpoints,
  isConnectedStatus,
  updateBrokerConnection,
} from '@/api';
import { openInBrowser } from '@/browser/openInBrowser';
import { AppModal } from '@/components/AppModal';
import { CustomButton } from '@/components/CustomButton';
import { CustomText } from '@/components/CustomText';
import { styles } from '@/components/UpstoxConnectModal/styles';

type User = {
  brokerMapping?: unknown;
  userBrokerMapping?: unknown;
  user_broker_mapping?: unknown;
};

type UpstoxConnectModalProps = {
  visible: boolean;
  brokerId: string;
  onDismiss: () => void;
  onConnected: (brokerId: string) => void;
};

export function UpstoxConnectModal({
  visible,
  brokerId,
  onDismiss,
  onConnected,
}: UpstoxConnectModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [loginOpened, setLoginOpened] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (visible) {
      return;
    }
    setFormError(null);
    setOpening(false);
    setLoginOpened(false);
    setChecking(false);
  }, [visible]);

  function leaveToHome() {
    onDismiss();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/performance');
  }

  async function login() {
    if (opening) {
      return;
    }

    setOpening(true);
    setFormError(null);
    try {
      const result = await api.get<{ url: string }>(endpoints.upstoxAuthorize);
      openInBrowser(result.url);
      setLoginOpened(true);
    } catch (err: unknown) {
      setFormError(errorMessage(err));
    } finally {
      setOpening(false);
    }
  }

  async function done() {
    if (checking) {
      return;
    }

    setChecking(true);
    setFormError(null);
    try {
      if (!loginOpened) {
        setFormError('Finish Upstox login in the browser, then tap Done');
        setChecking(false);
        return;
      }

      let user = await api.get<User>(endpoints.user);
      if (!isUpstoxConnected(brokerMappingsFrom(user), brokerId)) {
        await api.post(endpoints.markBrokerAsConnected, { brokerId }, { headers: { Accept: '*/*' } });
        user = await api.get<User>(endpoints.user);
      }

      const mapping = upstoxMapping(brokerMappingsFrom(user), brokerId);
      if (mapping && isConnectedStatus(mapping.brokerStatus)) {
        const connectedId = mapping.brokerId?.trim() || brokerId || 'upstox';
        updateBrokerConnection({ brokerId: connectedId, brokerStatus: 'CONNECTED' });
        onConnected(connectedId);
        leaveToHome();
        return;
      }
      setFormError('Finish Upstox login in the browser, then tap Done');
      setChecking(false);
    } catch (err: unknown) {
      setFormError(errorMessage(err));
      setChecking(false);
    }
  }

  return (
    <AppModal visible={visible} title="Connect Upstox" onDismiss={onDismiss}>
      <CustomText id="upstox-guide" variant="body" style={styles.guide}>
        <CustomText id="upstox-guide-link" variant="link" onPress={() => void login()}>
          Click here
        </CustomText>
        {' '}
        to login and when the browser says Upstox is connected, come back and tap Done.
      </CustomText>
      {formError ? (
        <CustomText id="upstox-error" variant="error">
          {formError}
        </CustomText>
      ) : null}
      <CustomButton
        id="upstox-done"
        label="Done"
        onPress={() => void done()}
        loading={checking}
      />
    </AppModal>
  );
}

function upstoxMapping(mappings: ReturnType<typeof brokerMappingsFrom>, brokerId: string) {
  return brokerMappingFor(mappings, brokerId, 'upstox');
}

function isUpstoxConnected(mappings: ReturnType<typeof brokerMappingsFrom>, brokerId: string): boolean {
  const mapping = upstoxMapping(mappings, brokerId);
  return Boolean(mapping && isConnectedStatus(mapping.brokerStatus));
}

function errorMessage(err: unknown) {
  if (err instanceof ApiError || err instanceof Error) {
    return err.message;
  }
  return 'Request failed';
}
