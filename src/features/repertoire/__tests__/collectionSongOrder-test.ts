import {
  getCollectionSongInsertionIndex,
  moveCollectionSong,
} from '@/features/repertoire/collectionSongOrder';

describe('ordenação das músicas da coleção', () => {
  it('move uma música para cima e para baixo sem alterar os demais itens', () => {
    const initial = ['a', 'b', 'c', 'd'];

    expect(moveCollectionSong(initial, 'c', 1)).toEqual(['a', 'c', 'b', 'd']);
    expect(moveCollectionSong(initial, 'b', 3)).toEqual(['a', 'c', 'd', 'b']);
  });

  it('preserva a lista quando o movimento é inválido ou não muda a posição', () => {
    const initial = ['a', 'b'];

    expect(moveCollectionSong(initial, 'missing', 0)).toBe(initial);
    expect(moveCollectionSong(initial, 'a', -1)).toBe(initial);
    expect(moveCollectionSong(initial, 'a', 0)).toBe(initial);
  });

  it('calcula o destino do arraste ignorando a música arrastada', () => {
    const layouts = [
      { height: 40, songId: 'a', y: 0 },
      { height: 40, songId: 'b', y: 48 },
      { height: 40, songId: 'c', y: 96 },
    ];

    expect(getCollectionSongInsertionIndex(layouts, 'a', 80)).toBe(1);
    expect(getCollectionSongInsertionIndex(layouts, 'a', 140)).toBe(2);
    expect(getCollectionSongInsertionIndex(layouts, 'b', 10)).toBe(0);
  });
});
