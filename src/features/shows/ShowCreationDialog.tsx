import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AutocompleteField } from '@/components/ui/AutocompleteField';
import type { Show } from '@/domain';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { SpinButton } from '@/components/ui/SpinButton';
import { OptionSheet } from '@/components/ui/list-controls/OptionSheet';
import { MonthCalendar } from '@/features/calendar/MonthCalendar';
import { formatDateFilter } from '@/utils/dateTime';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

export interface ShowCreationForm {
  readonly date: string;
  readonly name: string;
  readonly notes: string;
  readonly time: string;
  readonly venue: string;
}

interface ShowCreationDialogProps {
  readonly calendarShows?: readonly Show[];
  readonly venueOptions?: readonly string[];
  readonly errorMessage: string | null;
  readonly description?: string;
  readonly initialValues?: Partial<ShowCreationForm>;
  readonly submitLabel?: string;
  readonly title?: string;
  readonly initialDate?: string;
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onDirtyChange?: (dirty: boolean) => void;
  readonly onSubmit: (form: ShowCreationForm) => void;
  readonly visible: boolean;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return [year, month, day].join('-');
}

function getTimeParts(time: string) {
  const [hours = '', minutes = ''] = time.split(':');
  return { hours, minutes };
}

function normalizeTimePart(value: string) {
  return value.trim() ? value.padStart(2, '0') : '';
}

export function ShowCreationDialog({
  calendarShows = [],
  description = 'Cadastre a data e o local. O show começa como Rascunho para você montar o setlist depois.',
  errorMessage,
  initialDate,
  initialValues,
  submitLabel = 'Criar show',
  title = 'Novo show',
  isSubmitting,
  onClose,
  onDirtyChange,
  onSubmit,
  venueOptions = [],
  visible,
}: ShowCreationDialogProps) {
  const reducedMotion = useReducedMotionPreference();
  const [calendarVisible, setCalendarVisible] = useState(false);
  const initialForm: ShowCreationForm = {
    date: initialValues?.date ?? initialDate ?? localDateKey(new Date()),
    name: initialValues?.name ?? '',
    notes: initialValues?.notes ?? '',
    time: initialValues?.time ?? '20:00',
    venue: initialValues?.venue ?? '',
  };
  const [form, setForm] = useState<ShowCreationForm>(initialForm);
  const [discardVisible, setDiscardVisible] = useState(false);
  const hasChanges =
    form.date !== initialForm.date ||
    form.name !== initialForm.name ||
    form.notes !== initialForm.notes ||
    form.time !== initialForm.time ||
    form.venue !== initialForm.venue;
  useEffect(() => {
    onDirtyChange?.(visible && hasChanges);
  }, [hasChanges, onDirtyChange, visible]);
  const requestClose = () => {
    if (isSubmitting) return;
    if (hasChanges) {
      setDiscardVisible(true);
      return;
    }
    onClose();
  };

  const setField = (field: keyof ShowCreationForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const { hours, minutes } = getTimeParts(form.time);
  const validTime =
    /^\d{1,2}$/.test(hours) &&
    /^\d{1,2}$/.test(minutes) &&
    Number(hours) <= 23 &&
    Number(minutes) <= 59;
  const setTimePart = (part: 'hours' | 'minutes', value: string) => {
    const current = getTimeParts(form.time);
    const nextHours = part === 'hours' ? value : current.hours;
    const nextMinutes = part === 'minutes' ? value : current.minutes;
    setField(
      'time',
      `${normalizeTimePart(nextHours)}:${normalizeTimePart(nextMinutes)}`,
    );
  };
  const canSubmit =
    form.name.trim().length > 0 &&
    form.date.trim().length > 0 &&
    validTime &&
    form.venue.trim().length > 0 &&
    !isSubmitting;

  return (
    <Modal
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={requestClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        accessibilityViewIsModal
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalLayer}
      >
        <Pressable
          accessibilityLabel="Fechar janela de show tocando fora"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={requestClose}
          style={styles.scrim}
        />
        <View
          accessibilityLiveRegion="polite"
          style={styles.dialog}
          testID="show-creation-dialog"
        >
          <View style={styles.header}>
            <AppText accessibilityRole="header" variant="heading">
              {title}
            </AppText>
            <Pressable
              accessibilityLabel="Fechar janela de show"
              accessibilityRole="button"
              disabled={isSubmitting}
              hitSlop={spacing.sm}
              onPress={requestClose}
              style={styles.closeButton}
            >
              <AppIcon color={colors.text.secondary} name="close" size={20} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            style={styles.formScroll}
          >
            <AppText tone="muted">{description}</AppText>
            <Field
              label="Nome do show"
              accessibilityLabel="Nome do show"
              onChangeText={(value) => setField('name', value)}
              placeholder="Ex.: Festival da Praça"
              value={form.name}
            />
            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.halfField]}>
                <AppText variant="caption">Data</AppText>
                <Pressable
                  accessibilityLabel="Selecionar data do show"
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => setCalendarVisible(true)}
                  style={({ pressed }) => [
                    styles.dateButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppIcon
                    color={colors.text.secondary}
                    name="shows"
                    size={18}
                  />
                  <AppText numberOfLines={1} style={styles.dateButtonText}>
                    {formatDateFilter(form.date)}
                  </AppText>
                </Pressable>
              </View>
              <View style={[styles.fieldGroup, styles.halfField]}>
                <AppText variant="caption">Horário</AppText>
                <View style={styles.timeRow}>
                  <SpinButton
                    accessibilityLabel="Hora do show"
                    decrementLabel="Diminuir hora do show"
                    incrementLabel="Aumentar hora do show"
                    max={23}
                    maxLength={2}
                    onChangeText={(value) => setTimePart('hours', value)}
                    value={hours}
                  />
                  <AppText tone="muted" variant="heading">
                    :
                  </AppText>
                  <SpinButton
                    accessibilityLabel="Minutos do show"
                    decrementLabel="Diminuir minutos do show"
                    incrementLabel="Aumentar minutos do show"
                    max={59}
                    maxLength={2}
                    onChangeText={(value) => setTimePart('minutes', value)}
                    value={minutes}
                  />
                </View>
              </View>
            </View>
            <AutocompleteField
              accessibilityLabel="Local do show"
              label="Local"
              onChangeText={(value) => setField('venue', value)}
              options={venueOptions}
              placeholder="Ex.: Praça Central"
              value={form.venue}
            />
            <Field
              label="Observações"
              accessibilityLabel="Observações do show"
              multiline
              onChangeText={(value) => setField('notes', value)}
              placeholder="Opcional"
              value={form.notes}
            />
            {errorMessage ? (
              <AppText accessibilityRole="alert" style={styles.errorText}>
                {errorMessage}
              </AppText>
            ) : null}
          </ScrollView>
          <OptionSheet
            closeAccessibilityLabel="Fechar calendário da data do show"
            label="Escolher data do show"
            onClose={() => setCalendarVisible(false)}
            visible={calendarVisible}
          >
            <MonthCalendar
              key={form.date}
              initialDate={new Date()}
              onSelectDate={(dateKey) => {
                setField('date', dateKey);
                setCalendarVisible(false);
              }}
              selectedDateKey={form.date}
              shows={calendarShows}
            />
          </OptionSheet>
          <OptionSheet
            closeAccessibilityLabel="Continuar editando o show"
            label="Descartar alterações?"
            onClose={() => setDiscardVisible(false)}
            visible={discardVisible}
          >
            <AppText tone="muted">
              Você fez alterações neste formulário. Quer sair sem salvar?
            </AppText>
            <AppButton
              accessibilityLabel="Continuar editando"
              label="Continuar editando"
              onPress={() => setDiscardVisible(false)}
              variant="secondary"
            />
            <AppButton
              accessibilityLabel="Descartar alterações"
              label="Descartar alterações"
              onPress={() => {
                setDiscardVisible(false);
                onDirtyChange?.(false);
                onClose();
              }}
            />
          </OptionSheet>
          <View style={styles.actions}>
            <AppButton
              disabled={isSubmitting}
              label="Cancelar"
              onPress={requestClose}
              variant="secondary"
            />
            <AppButton
              accessibilityLabel="Confirmar criação do show"
              disabled={!canSubmit}
              icon="check"
              label={isSubmitting ? 'Salvando…' : submitLabel}
              onPress={() => onSubmit(form)}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  accessibilityLabel,
  containerStyle,
  keyboardType = 'default',
  label,
  multiline,
  onChangeText,
  placeholder,
  value,
}: {
  readonly accessibilityLabel: string;
  readonly containerStyle?: object;
  readonly keyboardType?: 'default' | 'numbers-and-punctuation';
  readonly label: string;
  readonly multiline?: boolean;
  readonly onChangeText: (value: string) => void;
  readonly placeholder: string;
  readonly value: string;
}) {
  return (
    <View style={[styles.fieldGroup, containerStyle]}>
      <AppText variant="caption">{label}</AppText>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  dialog: {
    backgroundColor: colors.background.raised,
    borderRadius: radii.lg,
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#08080a',
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      web: { boxShadow: '0px 4px 16px rgba(23, 32, 51, 0.18)' },
    }),
    maxHeight: '92%',
    maxWidth: 640,
    overflow: 'hidden',
    width: '92%',
  },
  errorText: { color: colors.semantic.danger },
  fieldGroup: { gap: spacing.xs },
  formContent: { gap: spacing.lg, padding: spacing.xl },
  formScroll: { flexGrow: 0 },
  halfField: { flex: 1, minWidth: 180 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  dateButton: {
    alignItems: 'center',
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
  },
  dateButtonText: { flex: 1 },
  input: {
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text.primary,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalLayer: {
    alignItems: 'center',
    backgroundColor: colors.background.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  multilineInput: { minHeight: 96, textAlignVertical: 'top' },
  pressed: { opacity: 0.72 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  timeRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  scrim: { ...StyleSheet.absoluteFill },
});
