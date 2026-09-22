import { fireEvent, render } from '@testing-library/react-native';

import type { LyricDocument } from '@/domain';
import { LyricDocumentEditor } from '@/features/repertoire/LyricDocumentEditor';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'generated-id'),
}));

describe('<LyricDocumentEditor />', () => {
  it('edita o texto de uma linha e permite reordená-la preservando seu tempo', async () => {
    const document: LyricDocument = {
      blocks: [
        {
          id: 'verse',
          name: 'Verso',
          lines: [
            { id: 'line-1', text: 'Primeira', startTimeMs: 1000 },
            { id: 'line-2', text: 'Segunda', startTimeMs: 2000 },
          ],
        },
      ],
    };
    const onChange = jest.fn();
    const view = await render(
      <LyricDocumentEditor document={document} onChange={onChange} />,
    );

    await fireEvent.changeText(
      view.getByLabelText('Linha 1 do bloco 1'),
      'Primeira linha revisada',
    );
    expect(onChange).toHaveBeenLastCalledWith({
      blocks: [
        {
          ...document.blocks[0],
          lines: [
            {
              id: 'line-1',
              text: 'Primeira linha revisada',
              startTimeMs: 1000,
            },
            document.blocks[0]!.lines[1],
          ],
        },
      ],
    });

    await fireEvent.press(
      view.getByLabelText('Mover linha 2 do bloco 1 para cima'),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      blocks: [
        {
          ...document.blocks[0],
          lines: [document.blocks[0]!.lines[1], document.blocks[0]!.lines[0]],
        },
      ],
    });
  });

  it('oferece inclusão e remoção de blocos e linhas com rótulos acessíveis', async () => {
    const onChange = jest.fn();
    const view = await render(
      <LyricDocumentEditor document={{ blocks: [] }} onChange={onChange} />,
    );

    expect(view.getByText('Nenhum bloco adicionado ainda.')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Adicionar bloco à letra'));
    const addedDocument = onChange.mock.calls[0]?.[0] as LyricDocument;
    const blockId = addedDocument.blocks[0]?.id;
    expect(blockId).toBeTruthy();
    await view.unmount();

    const blockView = await render(
      <LyricDocumentEditor
        document={{
          blocks: [{ id: blockId!, name: null, lines: [] }],
        }}
        onChange={onChange}
      />,
    );
    await fireEvent.press(
      blockView.getByLabelText('Adicionar linha ao bloco 1'),
    );
    const withLine = onChange.mock.calls.at(-1)?.[0] as LyricDocument;
    expect(withLine.blocks[0]?.lines).toHaveLength(1);
    expect(blockView.getByLabelText('Excluir bloco 1')).toBeTruthy();
  });
});
