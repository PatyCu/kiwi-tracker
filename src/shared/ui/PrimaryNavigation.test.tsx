import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { darkColors } from '@/shared/theme/palette';
import { AppHeader } from '@/shared/ui/AppHeader';
import { PrimaryNavigation, PrimaryNavigationItem } from '@/shared/ui/PrimaryNavigation';

jest.mock('@/shared/theme/AppearanceProvider');
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name, ...props }: { name: string }) => React.createElement(Text, props, name),
  };
});

const mockedUseAppearance = jest.mocked(useAppearance);

const makeItems = (): PrimaryNavigationItem[] => [
  {
    key: 'today',
    label: 'Today',
    icon: 'home-outline',
    activeIcon: 'home',
    selected: true,
    onPress: jest.fn(),
  },
  {
    key: 'pets',
    label: 'Pets',
    icon: 'paw-outline',
    activeIcon: 'paw',
    selected: false,
    onPress: jest.fn(),
  },
];

describe('responsive primary navigation', () => {
  beforeEach(() => {
    mockedUseAppearance.mockReturnValue({ colors: darkColors } as ReturnType<typeof useAppearance>);
  });

  it('shows persistent app identity in the mobile header', () => {
    const screen = render(<AppHeader />);

    expect(screen.getByText('Kiwi Tracker')).toBeTruthy();
    expect(screen.getByLabelText('Kiwi Tracker logo')).toBeTruthy();
  });

  it('shows labeled destinations and app identity in the desktop sidebar', () => {
    const items = makeItems();
    const screen = render(<PrimaryNavigation items={items} variant="sidebar" />);

    expect(screen.getByText('Kiwi Tracker')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Today', selected: true })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Pets', selected: false })).toBeTruthy();

    fireEvent.press(screen.getByRole('tab', { name: 'Pets' }));
    expect(items[1].onPress).toHaveBeenCalledTimes(1);
  });

  it('keeps labeled destinations in the mobile bottom navigation without duplicating identity', () => {
    const screen = render(<PrimaryNavigation items={makeItems()} variant="bottom" />);

    expect(screen.getByRole('tab', { name: 'Today', selected: true })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Pets', selected: false })).toBeTruthy();
    expect(screen.queryByText('Kiwi Tracker')).toBeNull();
  });

  it('does not show the desktop focus border after focusing a mobile tab', () => {
    const screen = render(<PrimaryNavigation items={makeItems()} variant="bottom" />);
    const petsTab = screen.getByRole('tab', { name: 'Pets' });

    fireEvent(petsTab, 'focus');

    expect(StyleSheet.flatten(petsTab.props.style)).not.toMatchObject({
      borderColor: darkColors.kiwi,
      borderWidth: 2,
    });
  });
});
