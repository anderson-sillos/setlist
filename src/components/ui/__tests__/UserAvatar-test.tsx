import { fireEvent, render } from '@testing-library/react-native';

import { UserAvatar } from '@/components/ui/UserAvatar';

describe('<UserAvatar />', () => {
  it('mostra as iniciais quando o perfil não tem imagem', async () => {
    const view = await render(<UserAvatar displayName="Ana Martins" />);

    expect(view.getByText('AM')).toBeTruthy();
    expect(view.queryByTestId('user-avatar-image')).toBeNull();
  });

  it('mostra o avatar do perfil e volta às iniciais se a imagem falhar', async () => {
    const view = await render(
      <UserAvatar
        avatarUrl="https://img.example.test/ana.png"
        displayName="Ana Martins"
      />,
    );

    expect(view.getByTestId('user-avatar-image').props.source).toEqual({
      uri: 'https://img.example.test/ana.png',
    });
    await fireEvent(view.getByTestId('user-avatar-image'), 'error');

    expect(view.getByText('AM')).toBeTruthy();
    expect(view.queryByTestId('user-avatar-image')).toBeNull();
  });
});
