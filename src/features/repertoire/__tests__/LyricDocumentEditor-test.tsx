import { fireEvent, render } from '@testing-library/react-native';

import type { LyricDocument } from '@/domain';
import { LyricDocumentEditor } from '@/features/repertoire/LyricDocumentEditor';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'generated-id'),
}));

describe('<LyricDocumentEditor />', () => {
  it('permite colar a letra completa usando marcadores de bloco e linha vazia', async () => {
    const onChange = jest.fn();
    const view = await render(
      <LyricDocumentEditor document={{ blocks: [] }} onChange={onChange} />,
    );

    expect(view.getByLabelText('Letra completa')).toBeTruthy();
    expect(view.getByText('Formato rápido')).toBeTruthy();

    await fireEvent.changeText(
      view.getByLabelText('Letra completa'),
      '# Verso\nPrimeira linha\n---\nSegunda linha\n# Refrão\nVolta pra casa',
    );

    expect(onChange).toHaveBeenLastCalledWith({
      blocks: [
        {
          id: expect.any(String),
          name: 'Verso',
          lines: [
            {
              id: expect.any(String),
              startTimeMs: null,
              text: 'Primeira linha',
            },
            { id: expect.any(String), startTimeMs: null, text: '' },
            {
              id: expect.any(String),
              startTimeMs: null,
              text: 'Segunda linha',
            },
          ],
        },
        {
          id: expect.any(String),
          name: 'Refrão',
          lines: [
            {
              id: expect.any(String),
              startTimeMs: null,
              text: 'Volta pra casa',
            },
          ],
        },
      ],
    });
  });

  it('reutiliza identificadores e tempos ao editar o texto de uma música existente', async () => {
    const document: LyricDocument = {
      blocks: [
        {
          id: 'verse',
          name: 'Verso',
          lines: [{ id: 'line-1', text: 'Primeira', startTimeMs: 1000 }],
        },
      ],
    };
    const onChange = jest.fn();

    const view = await render(
      <LyricDocumentEditor document={document} onChange={onChange} />,
    );
    fireEvent.changeText(
      view.getByLabelText('Letra completa'),
      '# Verso\nPrimeira revisada',
    );

    expect(onChange).toHaveBeenLastCalledWith({
      blocks: [
        {
          id: 'verse',
          name: 'Verso',
          lines: [
            { id: 'line-1', text: 'Primeira revisada', startTimeMs: 1000 },
          ],
        },
      ],
    });
  });

  it('mantém quebras de linha no campo enquanto a letra é digitada', async () => {
    const onChange = jest.fn();
    const view = await render(
      <LyricDocumentEditor document={{ blocks: [] }} onChange={onChange} />,
    );

    const input = view.getByLabelText('Letra completa');
    await fireEvent.changeText(input, 'Primeira linha\n');

    expect(input.props.value).toBe('Primeira linha\n');
  });
});
