import { AppButton } from '@/components/ui/AppButton';
import { AuthProviderIcon } from '@/features/auth/AuthProviderIcon';

interface AppleSignInButtonProps {
  readonly disabled?: boolean;
  readonly onPress: () => void;
  readonly testID?: string;
}

export function AppleSignInButton({
  disabled,
  onPress,
  testID = 'auth-apple',
}: AppleSignInButtonProps) {
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
