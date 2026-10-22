import { ActionNotice } from '@/components/feedback/ActionNotice';

interface StageAvailabilityDialogProps {
  readonly onClose: () => void;
  readonly visible: boolean;
}

const stageAvailabilityMessage =
  'Estamos reorganizando o modo palco. Ele estará disponível em uma versão futura do Setlist.';

export function StageAvailabilityDialog({
  onClose,
  visible,
}: StageAvailabilityDialogProps) {
  return (
    <ActionNotice
      message={visible ? stageAvailabilityMessage : null}
      onClose={onClose}
      testID="stage-availability-dialog"
      title="Modo palco em breve"
    />
  );
}
