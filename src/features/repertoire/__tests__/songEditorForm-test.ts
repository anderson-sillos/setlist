import {
  durationFromParts,
  durationToParts,
  emptySongEditorValues,
  parseSongEditorValues,
  songToEditorValues,
} from '@/features/repertoire/songEditorForm';
import { demoRepositoryData } from '@/data/demo';

describe('formulário de música', () => {
  it('separa e recompõe a duração por horas, minutos e segundos', () => {
    expect(durationToParts('1:02:03')).toEqual({
      hours: '1',
      minutes: '02',
      seconds: '03',
    });
    expect(durationToParts('3:45')).toEqual({
      hours: '',
      minutes: '3',
      seconds: '45',
    });
    expect(durationFromParts({ hours: '1', minutes: '2', seconds: '3' })).toBe(
      '1:02:03',
    );
    expect(durationFromParts({ hours: '', minutes: '3', seconds: '45' })).toBe(
      '3:45',
    );
  });

  it('exige título e aceita os campos opcionais vazios', () => {
    const result = parseSongEditorValues(emptySongEditorValues);

    expect(result.song).toBeNull();
    expect(result.errors.title).toBeTruthy();
  });

  it('normaliza os campos, BPM, duração e link válido do YouTube', () => {
    const result = parseSongEditorValues({
      ...emptySongEditorValues,
      bpm: '124',
      duration: '1:02:03',
      musicalKey: '  G  ',
      notes: '  Tocar mais leve  ',
      originalArtist: '  Artista original  ',
      title: '  Música nova  ',
      youtubeReference: ' https://youtu.be/abc123 ',
    });

    expect(result.errors).toEqual({});
    expect(result.song).toEqual({
      bpm: 124,
      estimatedDurationMs: 3_723_000,
      musicalKey: 'G',
      notes: 'Tocar mais leve',
      originalArtist: 'Artista original',
      title: 'Música nova',
      youtubeReference: 'https://youtu.be/abc123',
    });
  });

  it('rejeita BPM, duração e referências externas inválidos', () => {
    const result = parseSongEditorValues({
      ...emptySongEditorValues,
      bpm: '0',
      duration: '2:80',
      title: 'Música nova',
      youtubeReference: 'https://example.com/video',
    });

    expect(result.song).toBeNull();
    expect(result.errors.bpm).toBeTruthy();
    expect(result.errors.duration).toBeTruthy();
    expect(result.errors.youtubeReference).toBeTruthy();
  });

  it('preenche o editor a partir da música selecionada', () => {
    const song = demoRepositoryData.songs[0];

    expect(song).toBeDefined();
    expect(songToEditorValues(song!)).toMatchObject({
      title: song!.title,
      duration: expect.any(String),
      youtubeReference: song!.youtubeReference ?? '',
    });
  });
});
