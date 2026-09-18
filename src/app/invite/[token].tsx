import { useLocalSearchParams } from 'expo-router';

import { InviteScreen } from '@/features/auth/InviteScreen';
import { getSingleRouteParam } from '@/features/auth/prototypeLinks';

export default function InviteRoute() {
  const params = useLocalSearchParams<{
    authenticated?: string | string[];
    resumed?: string | string[];
    token?: string | string[];
  }>();

  return (
    <InviteScreen
      authenticated={getSingleRouteParam(params.authenticated)}
      resumed={getSingleRouteParam(params.resumed)}
      token={getSingleRouteParam(params.token)}
    />
  );
}
