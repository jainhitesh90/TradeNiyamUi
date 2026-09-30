import { View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

import { styles } from '@/components/TextField/styles';

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad' | 'decimal-pad';
  textContentType?: 'name' | 'username' | 'emailAddress' | 'telephoneNumber' | 'password' | 'newPassword';
  autoComplete?: 'name' | 'username' | 'email' | 'tel' | 'current-password' | 'new-password';
};

export function TextField({
  id,
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  autoCapitalize,
  autoCorrect,
  keyboardType,
  textContentType,
  autoComplete,
}: TextFieldProps) {
  return (
    <View>
      <TextInput
        testID={id}
        nativeID={id}
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={Boolean(error)}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        textContentType={textContentType}
        autoComplete={autoComplete}
        outlineStyle={styles.outline}
        style={styles.input}
      />
      {error ? (
        <HelperText type="error" visible testID={`${id}-error`}>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
}
