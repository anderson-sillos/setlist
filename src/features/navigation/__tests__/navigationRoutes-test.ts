import { demoIds } from '@/data/demo';
import {
  getBandSectionHref,
  getRepertoireCollectionCreateHref,
  getRepertoireCollectionEditHref,
  getRepertoireCollectionHref,
  getRepertoireCollectionsHref,
  getSongCreateHref,
  getSongEditHref,
  getSongLyricsHref,
  getShowHref,
  getSongHref,
  getStageHref,
} from '@/features/navigation/routes';

describe('rotas da navegação', () => {
  it('define os caminhos de Shows, Repertório, Palco e Banda', () => {
    expect(getBandSectionHref(demoIds.primaryBand, 'shows')).toBe(
      `/bands/${demoIds.primaryBand}/shows`,
    );
    expect(getBandSectionHref(demoIds.primaryBand, 'repertoire')).toBe(
      `/bands/${demoIds.primaryBand}/repertoire`,
    );
    expect(getBandSectionHref(demoIds.primaryBand, 'band')).toBe(
      `/bands/${demoIds.primaryBand}/band`,
    );
    expect(getBandSectionHref(demoIds.primaryBand, 'stage')).toBe(
      `/bands/${demoIds.primaryBand}/stage`,
    );
    expect(getBandSectionHref('banda com espaço', 'shows')).toBe(
      '/bands/banda%20com%20espa%C3%A7o/shows',
    );
    expect(getShowHref(demoIds.primaryBand, demoIds.readyShow)).toBe(
      `/bands/${demoIds.primaryBand}/shows/${demoIds.readyShow}`,
    );
    expect(getSongHref(demoIds.primaryBand, demoIds.stageSong)).toBe(
      `/bands/${demoIds.primaryBand}/repertoire/${demoIds.stageSong}`,
    );
    expect(getSongLyricsHref(demoIds.primaryBand, demoIds.stageSong)).toBe(
      `/bands/${demoIds.primaryBand}/repertoire/${demoIds.stageSong}/lyrics`,
    );
    expect(getSongCreateHref(demoIds.primaryBand)).toBe(
      `/bands/${demoIds.primaryBand}/repertoire/new`,
    );
    expect(getSongEditHref(demoIds.primaryBand, demoIds.stageSong)).toBe(
      `/bands/${demoIds.primaryBand}/repertoire/${demoIds.stageSong}/edit`,
    );
    expect(getRepertoireCollectionsHref(demoIds.primaryBand)).toBe(
      `/bands/${demoIds.primaryBand}/repertoire/collections`,
    );
    expect(
      getRepertoireCollectionHref(demoIds.primaryBand, 'collection festa'),
    ).toBe(
      `/bands/${demoIds.primaryBand}/repertoire/collections/collection%20festa`,
    );
    expect(getRepertoireCollectionCreateHref(demoIds.primaryBand)).toBe(
      `/bands/${demoIds.primaryBand}/repertoire/collections/new`,
    );
    expect(
      getRepertoireCollectionCreateHref(
        demoIds.primaryBand,
        ['song id 1', 'song&2'],
        true,
      ),
    ).toBe(
      `/bands/${demoIds.primaryBand}/repertoire/collections/new?songId=song%20id%201&songId=song%262&returnTo=repertoire`,
    );
    expect(
      getRepertoireCollectionEditHref(demoIds.primaryBand, 'collection-festa'),
    ).toBe(
      `/bands/${demoIds.primaryBand}/repertoire/collections/collection-festa/edit`,
    );
    expect(getRepertoireCollectionHref(demoIds.primaryBand, 'new')).not.toBe(
      getSongHref(demoIds.primaryBand, 'new'),
    );
    expect(getStageHref(demoIds.primaryBand, demoIds.readyShow)).toBe(
      `/bands/${demoIds.primaryBand}/shows/${demoIds.readyShow}/stage`,
    );
  });
});
