import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams } from 'expo-router';

import { OAuthCallbackScreen } from '@/features/auth/OAuthCallbackScreen';
import { getSingleRouteParam } from '@/features/auth/prototypeLinks';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallbackRoute() {
  const params = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
    invite_token?: string | string[];
    state?: string | string[];
  }>();

  return (
    <OAuthCallbackScreen
      code={getSingleRouteParam(params.code)}
      error={getSingleRouteParam(params.error)}
      errorDescription={getSingleRouteParam(params.error_description)}
      inviteToken={getSingleRouteParam(params.invite_token)}
      state={getSingleRouteParam(params.state)}
    />
  );
}
