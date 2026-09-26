import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { ApiError, api, endpoints, updateBrokerConnection } from '@/api';
import { openInBrowser } from '@/browser/openInBrowser';
import { AppModal } from '@/components/AppModal';
import { CustomButton } from '@/components/CustomButton';
import { CustomText } from '@/components/CustomText';
import { styles } from '@/components/GrowwConnectModal/styles';
import { TextField } from '@/components/TextField';

type BrokerMapping = {
  brokerStatus: string;
} | null;

type GrowwConnectModalProps = {
  visible: boolean;
  brokerLinkUrl: string;
  brokerMapping: BrokerMapping;
  onDismiss: () => void;
};

const generateTokenGuide =
  'to generate the token on groww, copy the api-key and api-secret once generated and paste in below input boxes, and save';

export function GrowwConnectModal({
  visible,
  brokerLinkUrl,
  brokerMapping,
  onDismiss,
}: GrowwConnectModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiSecretError, setApiSecretError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      return;
    }
    setApiKey('');
    setApiSecret('');
    setApiKeyError(null);
    setApiSecretError(null);
    setFormError(null);
    setSaving(false);
  }, [visible]);

  const disconnected = brokerMapping?.brokerStatus === 'DISCONNECTED';

  function openGrowwLink() {
    if (brokerLinkUrl) {
      openInBrowser(brokerLinkUrl);
    }
  }

  function leaveToHome() {
    onDismiss();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/performance');
  }

  async function done() {
    if (saving) {
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await api.post(endpoints.markBrokerAsConnected, {
      }, {
        headers: { Accept: '*/*' },
      });
      updateBrokerConnection({ brokerId: 'groww', brokerStatus: 'CONNECTED' });
      leaveToHome();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Request failed');
      }
      setSaving(false);
    }
  }

  async function save() {
    const key = apiKey.trim();
    const secret = apiSecret.trim();
    const nextKeyError = key ? null : 'Enter the API key';
    const nextSecretError = secret ? null : 'Enter the API secret';
    setApiKeyError(nextKeyError);
    setApiSecretError(nextSecretError);
    setFormError(null);
    if (nextKeyError || nextSecretError || saving) {
      return;
    }

    setSaving(true);
    try {
      await api.post(endpoints.brokerMapping, {
        apiKey: key,
        apiSecret: secret,
      }, {
        headers: { Accept: '*/*' },
      });
      updateBrokerConnection({ brokerId: 'groww', brokerStatus: 'CONNECTED' });
      leaveToHome();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Request failed');
      }
      setSaving(false);
    }
  }

  return (
    <AppModal visible={visible} title="Connect Groww" onDismiss={onDismiss}>
        <CustomText id="groww-guide" variant="body" style={styles.guide}>
          <CustomText id="groww-guide-link" variant="link" onPress={openGrowwLink}>
            Click here
          </CustomText>
          {' '}
          {disconnected
            ? 'approve the token, and close the dialog once approved'
            : generateTokenGuide}
        </CustomText>
        {disconnected ? (
          <>
            {formError ? (
              <CustomText id="groww-done-error" variant="error">
                {formError}
              </CustomText>
            ) : null}
            <CustomButton id="groww-done" label="Done" onPress={() => void done()} loading={saving} />
          </>
        ) : (
          <>
            <TextField
              id="groww-api-key"
              label="API key"
              value={apiKey}
              onChangeText={setApiKey}
              error={apiKeyError ?? undefined}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextField
              id="groww-api-secret"
              label="API secret"
              value={apiSecret}
              onChangeText={setApiSecret}
              error={apiSecretError ?? undefined}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {formError ? (
              <CustomText id="groww-save-error" variant="error">
                {formError}
              </CustomText>
            ) : null}
            <CustomButton id="groww-save" label="Save" onPress={() => void save()} loading={saving} />
          </>
        )}
    </AppModal>
  );
}
