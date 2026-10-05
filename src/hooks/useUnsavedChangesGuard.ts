import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

interface UseUnsavedChangesGuardOptions {
  readonly dirty: boolean;
  readonly saving: boolean;
}

/** Prevents route removal until a dirty editor's user confirms the decision. */
export function useUnsavedChangesGuard({
  dirty,
  saving,
}: UseUnsavedChangesGuardOptions) {
  const navigation = useNavigation();
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);
  const dirtyRef = useRef(dirty);
  const savingRef = useRef(saving);
  const continueEditing = useCallback(() => {
    pendingAction.current = null;
    setConfirmationVisible(false);
  }, []);
  const discardAndLeave = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    dirtyRef.current = false;
    setConfirmationVisible(false);
    action?.();
  }, []);
  const allowNextRemoval = useCallback(() => {
    dirtyRef.current = false;
  }, []);

  useEffect(() => {
    dirtyRef.current = dirty;
    savingRef.current = saving;
  }, [dirty, saving]);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (event) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      if (savingRef.current) return;
      pendingAction.current = () => navigation.dispatch(event.data.action);
      setConfirmationVisible(true);
    });
  }, [navigation]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !dirty || typeof window === 'undefined') {
      return;
    }
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [dirty]);

  return {
    confirmationVisible,
    allowNextRemoval,
    continueEditing,
    discardAndLeave,
  };
}
