import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  ErrorFeedback,
  LoadingFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { AutocompleteField } from '@/components/ui/AutocompleteField';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { SpinButton } from '@/components/ui/SpinButton';
import {
  createSong,
  SongMutationError,
  updateSong,
} from '@/data/supabase/songMutations';
import { useSong, useUserBands, useUserRepertoireSongs } from '@/data/queries';
import { demoIds } from '@/data/demo';
import type { EntityId, LyricDocument } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  getSongCreateHref,
  getSongEditHref,
  getSongHref,
} from '@/features/navigation/routes';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { LyricDocumentEditor } from './LyricDocumentEditor';
import {
  durationFromEditorParts,
  durationToParts,
  emptySongEditorValues,
  parseSongEditorValues,
  songToEditorValues,
  type DurationParts,
  type SongEditorErrors,
  type SongEditorField,
  type SongEditorValues,
} from './songEditorForm';

interface SongEditorScreenProps {
  readonly bandId: EntityId;
  readonly songId?: EntityId;
}

const emptyLyricDocument: LyricDocument = { blocks: [] };

export function SongEditorScreen({ bandId, songId }: SongEditorScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userBandsQuery = useUserBands();
  const userRepertoireSongsQuery = useUserRepertoireSongs();
  const songQuery = useSong(bandId, songId ?? '', Boolean(songId));
  const [editedValues, setEditedValues] = useState<{
    readonly songId: EntityId | null;
    readonly values: SongEditorValues;
  } | null>(null);
  const [editedLyrics, setEditedLyrics] = useState<{
    readonly songId: EntityId | null;
    readonly document: LyricDocument;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SongEditorErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const song = songQuery.data;
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const isDemoBand =
    bandId === demoIds.primaryBand || bandId === demoIds.secondaryBand;
  const canEdit = membership?.role === 'owner' || membership?.role === 'editor';
  const isLoading =
    userBandsQuery.isPending || (Boolean(songId) && songQuery.isPending);
  const originalArtistOptions = Array.from(
    new Set(
      userRepertoireSongsQuery.data
        ?.map(({ originalArtist }) => originalArtist?.trim() ?? '')
        .filter(Boolean) ?? [],
    ),
  );
  const title = songId ? 'Editar música' : 'Nova música';
  const values =
    editedValues?.songId === (songId ?? null)
      ? editedValues.values
      : song
        ? songToEditorValues(song)
        : emptySongEditorValues;
  const lyrics =
    editedLyrics?.songId === (songId ?? null)
      ? editedLyrics.document
      : (song?.lyrics ?? emptyLyricDocument);

  const setField = (field: SongEditorField, value: string) => {
    setEditedValues({
      songId: songId ?? null,
      values: { ...values, [field]: value },
    });
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const handleSave = async () => {
    const parsed = parseSongEditorValues(values);
    setFieldErrors(parsed.errors);
    setSubmitError(null);

    if (!parsed.song) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (songId) {
        await updateSong({ bandId, lyrics, song: parsed.song, songId });
        await queryClient.invalidateQueries({
          queryKey: ['bands', bandId, 'songs'],
        });
        await queryClient.invalidateQueries({ queryKey: ['songs', 'user'] });
        router.back();
      } else {
        const createdSongId = await createSong({
          bandId,
          lyrics,
          song: parsed.song,
        });
        await queryClient.invalidateQueries({
          queryKey: ['bands', bandId, 'songs'],
        });
        await queryClient.invalidateQueries({ queryKey: ['songs', 'user'] });
        router.replace(getSongHref(bandId, createdSongId));
      }
    } catch (error) {
      setSubmitError(
        error instanceof SongMutationError
          ? error.message
          : 'Não foi possível salvar a música agora. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BandAreaLayout
      activeSection="repertoire"
      bandId={bandId}
      currentRoute={
        songId
          ? (getSongEditHref(bandId, songId) as string)
          : (getSongCreateHref(bandId) as string)
      }
      screenKind="edit"
      scrollable={false}
      title={title}
    >
      {isLoading ? <LoadingFeedback /> : null}
      {userBandsQuery.isError ? (
        <ErrorFeedback onRetry={() => void userBandsQuery.refetch()} />
      ) : null}
      {songQuery.isError && songId ? (
        <ErrorFeedback onRetry={() => void songQuery.refetch()} />
      ) : null}
      {!isLoading && !userBandsQuery.isError && isDemoBand ? (
        <UnavailableFeedback title="Músicas de demonstração são somente leitura" />
      ) : null}
      {!isLoading && !userBandsQuery.isError && !isDemoBand && !canEdit ? (
        <UnavailableFeedback title="Seu papel permite consultar o repertório, não editá-lo" />
      ) : null}
      {!isLoading && songId && !songQuery.isError && !song ? (
        <UnavailableFeedback title="Música indisponível" />
      ) : null}
      {!isLoading &&
      !userBandsQuery.isError &&
      !songQuery.isError &&
      !isDemoBand &&
      canEdit &&
      (!songId || song) ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.editor}
          testID="song-editor-keyboard-layout"
        >
          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            testID="song-editor-scroll"
          >
            <SongEditorFieldView
              error={fieldErrors.title}
              label="Título da música *"
              onChangeText={(value) => setField('title', value)}
              placeholder="Ex.: A rua acende devagar"
              value={values.title}
            />
            <AutocompleteField
              accessibilityLabel="Artista/Banda"
              error={fieldErrors.originalArtist}
              label="Artista/Banda"
              onChangeText={(value) => setField('originalArtist', value)}
              options={originalArtistOptions}
              placeholder="Ex.: Artista original"
              value={values.originalArtist}
            />

            <SongDurationFieldView
              containerStyle={styles.durationField}
              error={fieldErrors.duration}
              onChangeText={(value) => setField('duration', value)}
              value={values.duration}
            />

            <View style={styles.inlineFields}>
              <SongEditorFieldView
                containerStyle={styles.smallField}
                error={fieldErrors.musicalKey}
                label="Tom"
                onChangeText={(value) => setField('musicalKey', value)}
                placeholder="Ex.: G"
                value={values.musicalKey}
              />
              <SongEditorFieldView
                containerStyle={styles.smallField}
                error={fieldErrors.bpm}
                keyboardType="number-pad"
                label="BPM"
                onChangeText={(value) => setField('bpm', value)}
                placeholder="Ex.: 120"
                value={values.bpm}
              />
            </View>

            <SongEditorFieldView
              error={fieldErrors.youtubeReference}
              keyboardType="url"
              label="Link de referência do YouTube"
              onChangeText={(value) => setField('youtubeReference', value)}
              placeholder="https://youtu.be/..."
              value={values.youtubeReference}
            />
            <SongEditorFieldView
              error={fieldErrors.notes}
              label="Observações"
              multiline
              onChangeText={(value) => setField('notes', value)}
              placeholder="Informações úteis para a banda"
              value={values.notes}
            />

            <LyricDocumentEditor
              document={lyrics}
              onChange={(document) => {
                setEditedLyrics({ songId: songId ?? null, document });
                setSubmitError(null);
              }}
            />

            {submitError ? (
              <AppText accessibilityRole="alert" style={styles.errorText}>
                {submitError}
              </AppText>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <AppButton
              disabled={isSubmitting}
              label="Cancelar"
              onPress={() => router.back()}
              variant="secondary"
            />
            <AppButton
              disabled={isSubmitting}
              icon="check"
              label={isSubmitting ? 'Salvando…' : 'Salvar música'}
              onPress={() => void handleSave()}
            />
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </BandAreaLayout>
  );
}

interface SongEditorFieldViewProps {
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly error?: string;
  readonly keyboardType?: 'default' | 'number-pad' | 'url';
  readonly label: string;
  readonly multiline?: boolean;
  readonly onChangeText: (value: string) => void;
  readonly placeholder: string;
  readonly value: string;
}

function SongEditorFieldView({
  containerStyle,
  error,
  keyboardType = 'default',
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: SongEditorFieldViewProps) {
  return (
    <View style={[styles.field, containerStyle]}>
      <AppText variant="caption">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ? `Erro: ${error}` : undefined}
        autoCapitalize={keyboardType === 'url' ? 'none' : 'sentences'}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          multiline && Platform.OS === 'web' && styles.multilineInputWeb,
        ]}
        value={value}
      />
      {error ? (
        <AppText accessibilityRole="alert" style={styles.fieldError}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

interface SongDurationFieldViewProps {
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly error?: string;
  readonly onChangeText: (value: string) => void;
  readonly value: string;
}

function SongDurationFieldView({
  containerStyle,
  error,
  onChangeText,
  value,
}: SongDurationFieldViewProps) {
  const parts = durationToParts(value);

  const updatePart = (part: keyof DurationParts, nextValue: string) => {
    onChangeText(
      durationFromEditorParts({
        ...parts,
        [part]: nextValue.replace(/\D/g, ''),
      }),
    );
  };

  return (
    <View style={[styles.field, containerStyle]}>
      <AppText variant="caption">Duração</AppText>
      <View style={styles.durationParts}>
        <DurationPartInput
          accessibilityLabel="Horas da duração"
          onChangeText={(nextValue) => updatePart('hours', nextValue)}
          value={parts.hours}
          suffix="h"
        />
        <DurationPartInput
          accessibilityLabel="Minutos da duração"
          onChangeText={(nextValue) => updatePart('minutes', nextValue)}
          value={parts.minutes}
          suffix="min"
        />
        <DurationPartInput
          accessibilityLabel="Segundos da duração"
          onChangeText={(nextValue) => updatePart('seconds', nextValue)}
          value={parts.seconds}
          suffix="s"
        />
      </View>
      {error ? (
        <AppText accessibilityRole="alert" style={styles.fieldError}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

interface DurationPartInputProps {
  readonly accessibilityLabel: string;
  readonly onChangeText: (value: string) => void;
  readonly suffix: string;
  readonly value: string;
}

function DurationPartInput({
  accessibilityLabel,
  onChangeText,
  suffix,
  value,
}: DurationPartInputProps) {
  return (
    <View style={styles.durationPart}>
      <SpinButton
        accessibilityLabel={accessibilityLabel}
        decrementLabel={`Diminuir ${accessibilityLabel.toLowerCase()}`}
        incrementLabel={`Aumentar ${accessibilityLabel.toLowerCase()}`}
        max={suffix === 'h' ? 999 : 59}
        maxLength={suffix === 'h' ? 3 : 2}
        onChangeText={onChangeText}
        value={value}
      />
      <AppText style={styles.durationSuffix} tone="muted" variant="caption">
        {suffix}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    flex: 1,
    minHeight: 0,
  },
  formContent: {
    alignItems: 'stretch',
    alignSelf: 'center',
    gap: spacing.lg,
    maxWidth: layout.contentMaxWidth,
    padding: spacing.xl,
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  field: {
    flexGrow: 0,
    flexShrink: 0,
    gap: spacing.xs,
    minWidth: 160,
  },
  fieldError: {
    color: '#b91c1c',
  },
  errorText: {
    color: '#b91c1c',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
  },
  inlineFields: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  multilineInput: {
    minHeight: 112,
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
  },
  multilineInputWeb: {
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 0,
    height: 120,
    maxHeight: 120,
    minHeight: 120,
    width: '100%',
  },
  smallField: {
    flexGrow: 1,
    flexBasis: 88,
  },
  durationParts: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    maxWidth: '100%',
    width: '100%',
  },
  durationPart: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    flexBasis: 0,
    maxWidth: '100%',
    minWidth: 0,
  },
  durationSuffix: {
    marginLeft: spacing.xs,
  },
  durationField: {
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 0,
    maxWidth: '100%',
    width: '100%',
  },
});
