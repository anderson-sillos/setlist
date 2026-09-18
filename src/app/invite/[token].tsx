import { useLocalSearchParams } from 'expo-router';

import { InvitePrototypeScreen } from '@/features/auth/InvitePrototypeScreen';
import { getSingleRouteParam } from '@/features/auth/prototypeLinks';

export default function InvitePrototypeRoute() {
  const params = useLocalSearchParams<{
    resumed?: string | string[];
    token?: string | string[];
  }>();

  return (
    <InvitePrototypeScreen
      resumed={getSingleRouteParam(params.resumed)}
      token={getSingleRouteParam(params.token)}
    />
  );
}
