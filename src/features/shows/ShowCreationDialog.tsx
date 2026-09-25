import { useState } from 'react';
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
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colors, layout, radii, spacing } from '@/theme/tokens';

export interface ShowCreationForm {
  readonly date: string;
  readonly name: string;
  readonly notes: string;
  readonly time: string;
  readonly venue: string;
}

interface ShowCreationDialogProps {
  readonly errorMessage: string | null;
  readonly description?: string;
  readonly initialValues?: Partial<ShowCreationForm>;
  readonly submitLabel?: string;
  readonly title?: string;
  readonly initialDate?: string;
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (form: ShowCreationForm) => void;
  readonly visible: boolean;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return [year, month, day].join('-');
}

export function ShowCreationDialog({
  description = 'Cadastre a data e o local. O show começa como Rascunho para você montar o setlist depois.',
  errorMessage,
  initialDate,
  initialValues,
  submitLabel = 'Criar show',
  title = 'Novo show',
  isSubmitting,
  onClose,
  onSubmit,
  visible,
}: ShowCreationDialogProps) {
  const [form, setForm] = useState<ShowCreationForm>(() => ({
    date: initialValues?.date ?? initialDate ?? localDateKey(new Date()),
    name: initialValues?.name ?? '',
    notes: initialValues?.notes ?? '',
    time: initialValues?.time ?? '20:00',
    venue: initialValues?.venue ?? '',
  }));

  const setField = (field: keyof ShowCreationForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const canSubmit =
    form.name.trim().length > 0 &&
    form.date.trim().length > 0 &&
    form.time.trim().length > 0 &&
    form.venue.trim().length > 0 &&
    !isSubmitting;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
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
          onPress={onClose}
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
              onPress={onClose}
              style={styles.closeButton}
            >
              <AppIcon color={colors.muted} name="close" size={20} />
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
              <Field
                containerStyle={styles.halfField}
                keyboardType="numbers-and-punctuation"
                label="Data"
                accessibilityLabel="Data do show"
                onChangeText={(value) => setField('date', value)}
                placeholder="AAAA-MM-DD"
                value={form.date}
              />
              <Field
                containerStyle={styles.halfField}
                keyboardType="numbers-and-punctuation"
                label="Horário"
                accessibilityLabel="Horário do show"
                onChangeText={(value) => setField('time', value)}
                placeholder="HH:MM"
                value={form.time}
              />
            </View>
            <Field
              label="Local"
              accessibilityLabel="Local do show"
              onChangeText={(value) => setField('venue', value)}
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
          <View style={styles.actions}>
            <AppButton
              disabled={isSubmitting}
              label="Cancelar"
              onPress={onClose}
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
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    borderTopColor: colors.line,
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
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    elevation: 8,
    maxHeight: '92%',
    maxWidth: 640,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    width: '92%',
  },
  errorText: { color: colors.amber },
  fieldGroup: { gap: spacing.xs },
  formContent: { gap: spacing.lg, padding: spacing.xl },
  formScroll: { flexGrow: 0 },
  halfField: { flex: 1, minWidth: 130 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  input: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalLayer: {
    alignItems: 'center',
    backgroundColor: 'rgba(25, 20, 45, 0.48)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  multilineInput: { minHeight: 96, textAlignVertical: 'top' },
  pressed: { opacity: 0.72 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  scrim: { ...StyleSheet.absoluteFill },
});
