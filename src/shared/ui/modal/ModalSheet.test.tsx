import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppearanceProvider } from '@/shared/theme/AppearanceProvider';
import { ModalSheet } from '@/shared/ui/modal/ModalSheet';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text: MockText } = require('react-native');
  return {
    Ionicons: ({ name, ...props }: { name: string }) => React.createElement(MockText, props, name),
  };
});

describe('ModalSheet', () => {
  it('provides a visible close action', () => {
    const onClose = jest.fn();
    const screen = render(
      <AppearanceProvider>
        <ModalSheet visible title="Edit pet" testID="edit-pet-modal" onClose={onClose}>
          <Text>Pet form</Text>
        </ModalSheet>
      </AppearanceProvider>,
    );

    expect(screen.getByText('Edit pet')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
