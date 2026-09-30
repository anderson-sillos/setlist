import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AuthProviderIcon } from '@/features/auth/AuthProviderIcon';

interface AppleSignInButtonProps {
  readonly disabled?: boolean;
  readonly onPress: () => void;
  readonly testID?: string;
}

export function AppleSignInButton({
  disabled = false,
  onPress,
  testID = 'auth-apple',
}: AppleSignInButtonProps) {
  const [nativeSignInAvailable, setNativeSignInAvailable] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (isMounted) {
          setNativeSignInAvailable(available);
        }
      })
      .catch(() => {
        if (isMounted) {
          setNativeSignInAvailable(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!nativeSignInAvailable) {
    return (
      <AppButton
        disabled={disabled}
        leading={<AuthProviderIcon provider="apple" size={24} />}
        label="Continuar com Apple"
        onPress={onPress}
        testID={testID}
        variant="secondary"
      />
    );
  }

  return (
    <View
      accessibilityState={{ disabled }}
      pointerEvents={disabled ? 'none' : 'auto'}
      style={[styles.wrapper, disabled && styles.disabled]}
      testID={testID}
    >
      <AppleAuthentication.AppleAuthenticationButton
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        cornerRadius={8}
        onPress={onPress}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  wrapper: {
    width: '100%',
  },
});
