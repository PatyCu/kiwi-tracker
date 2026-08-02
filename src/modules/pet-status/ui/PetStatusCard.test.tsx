import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { PetStatusLevel } from '@/modules/pet-status/calculatePetStatus';
import { PetStatusCard } from '@/modules/pet-status/ui/PetStatusCard';
import { Pet } from '@/modules/pets/model/Pet';
import { darkColors } from '@/shared/theme/palette';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name, ...props }: { name: string }) => React.createElement(Text, props, name),
  };
});

const pet: Pet = {
  id: 'kiwi',
  name: 'Kiwi',
  species: 'Cat',
  createdAt: '2025-01-01T00:00:00.000Z',
};

describe('PetStatusCard', () => {
  it.each([
    [PetStatusLevel.Red, darkColors.coral],
    [PetStatusLevel.Amber, darkColors.statusAmber],
    [PetStatusLevel.Green, darkColors.kiwi],
  ])('uses the %s status color for both the Today indicator and heart', (status, color) => {
    const screen = render(
      <PetStatusCard
        pet={pet}
        status={{ status, headline: 'Headline', description: 'Description' }}
        wide={false}
        colors={darkColors}
      />,
    );

    expect(
      StyleSheet.flatten(screen.getByTestId('today-status-indicator').props.style),
    ).toMatchObject({ borderColor: color });
    expect(screen.getByTestId('today-status-icon').props).toMatchObject({
      color,
      children: 'heart',
    });
    expect(StyleSheet.flatten(screen.getByTestId('today-summary-card').props.style)).toMatchObject({
      borderColor: darkColors.line,
    });
    expect(
      StyleSheet.flatten(screen.getByTestId('today-status-description').props.style),
    ).toMatchObject({ gap: 6 });
  });
});
