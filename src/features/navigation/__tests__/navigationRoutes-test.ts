import {
  getBandSectionHref,
  getRepertoireCollectionFilterHref,
  getRepertoireCollectionCreateHref,
  getRepertoireCollectionEditHref,
  getRepertoireCollectionsHref,
  getSongCreateHref,
  getSongEditHref,
  getSongLyricsHref,
  getShowHref,
  getSongHref,
  getStageHref,
} from '@/features/navigation/routes';

const BAND_ID = 'band-routes-test';
const SHOW_ID = 'show-routes-test';
const SONG_ID = 'song-routes-test';

describe('rotas da navegação', () => {
  it('define os caminhos de Shows, Repertório, Palco e Banda', () => {
    expect(getBandSectionHref(BAND_ID, 'shows')).toBe(
      `/bands/${BAND_ID}/shows`,
    );
    expect(getBandSectionHref(BAND_ID, 'repertoire')).toBe(
      `/bands/${BAND_ID}/repertoire`,
    );
    expect(
      getRepertoireCollectionFilterHref('banda com espaço', 'coleção festa'),
    ).toBe(
      '/bands/banda%20com%20espa%C3%A7o/repertoire?collectionId=cole%C3%A7%C3%A3o%20festa',
    );
    expect(getBandSectionHref(BAND_ID, 'band')).toBe(`/bands/${BAND_ID}/band`);
    expect(getBandSectionHref(BAND_ID, 'stage')).toBe(
      `/bands/${BAND_ID}/stage`,
    );
    expect(getBandSectionHref('banda com espaço', 'shows')).toBe(
      '/bands/banda%20com%20espa%C3%A7o/shows',
    );
    expect(getShowHref(BAND_ID, SHOW_ID)).toBe(
      `/bands/${BAND_ID}/shows/${SHOW_ID}`,
    );
    expect(getSongHref(BAND_ID, SONG_ID)).toBe(
      `/bands/${BAND_ID}/repertoire/${SONG_ID}`,
    );
    expect(getSongLyricsHref(BAND_ID, SONG_ID)).toBe(
      `/bands/${BAND_ID}/repertoire/${SONG_ID}/lyrics`,
    );
    expect(getSongCreateHref(BAND_ID)).toBe(`/bands/${BAND_ID}/repertoire/new`);
    expect(getSongEditHref(BAND_ID, SONG_ID)).toBe(
      `/bands/${BAND_ID}/repertoire/${SONG_ID}/edit`,
    );
    expect(getRepertoireCollectionsHref(BAND_ID)).toBe(
      `/bands/${BAND_ID}/repertoire/collections`,
    );
    expect(getRepertoireCollectionCreateHref(BAND_ID)).toBe(
      `/bands/${BAND_ID}/repertoire/collections/new`,
    );
    expect(
      getRepertoireCollectionCreateHref(BAND_ID, ['song id 1', 'song&2'], true),
    ).toBe(
      `/bands/${BAND_ID}/repertoire/collections/new?songId=song%20id%201&songId=song%262&returnTo=repertoire`,
    );
    expect(getRepertoireCollectionEditHref(BAND_ID, 'collection-festa')).toBe(
      `/bands/${BAND_ID}/repertoire/collections/collection-festa/edit`,
    );
    expect(getStageHref(BAND_ID, SHOW_ID)).toBe(
      `/bands/${BAND_ID}/shows/${SHOW_ID}/stage`,
    );
  });
});
