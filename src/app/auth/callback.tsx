import { useLocalSearchParams } from 'expo-router';

import { OAuthCallbackPrototypeScreen } from '@/features/auth/OAuthCallbackPrototypeScreen';
import { getSingleRouteParam } from '@/features/auth/prototypeLinks';

export default function OAuthCallbackPrototypeRoute() {
  const params = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    invite_token?: string | string[];
    state?: string | string[];
  }>();

  return (
    <OAuthCallbackPrototypeScreen
      code={getSingleRouteParam(params.code)}
      error={getSingleRouteParam(params.error)}
      inviteToken={getSingleRouteParam(params.invite_token)}
      state={getSingleRouteParam(params.state)}
    />
  );
}
