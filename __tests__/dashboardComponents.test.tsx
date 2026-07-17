import { fireEvent, render } from '@testing-library/react-native';

import { PetSelector } from '@/components/dashboard/PetSelector';
import { QuickLog } from '@/components/dashboard/QuickLog';
import { Timeline } from '@/components/dashboard/Timeline';
import { Pet } from '@/lib/pets';
import { darkColors } from '@/lib/theme';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name),
  };
});

const pets: Pet[] = [
  {
    id: 'kiwi',
    name: 'Kiwi',
    species: 'Cat',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'miso',
    name: 'Miso',
    species: 'Dog',
    breed: 'Beagle',
    createdAt: '2025-01-02T00:00:00.000Z',
  },
];

describe('dashboard components', () => {
  it('renders individual pet cards and reports selection and creation actions', () => {
    const onSelectPet = jest.fn();
    const onAddPet = jest.fn();
    const screen = render(
      <PetSelector
        pets={pets}
        activePetId="kiwi"
        colors={darkColors}
        onSelectPet={onSelectPet}
        onAddPet={onAddPet}
      />,
    );

    fireEvent.press(screen.getByLabelText('Miso'));
    fireEvent.press(screen.getByLabelText('Add another pet'));

    expect(screen.getByLabelText('Kiwi, active pet')).toBeTruthy();
    expect(onSelectPet).toHaveBeenCalledWith('miso');
    expect(onAddPet).toHaveBeenCalledTimes(1);
  });

  it('keeps all quick-log actions connected to the current event flow', () => {
    const onLog = jest.fn();
    const screen = render(<QuickLog colors={darkColors} onLog={onLog} />);

    fireEvent.press(screen.getByText('Meal'));

    expect(onLog).toHaveBeenCalledTimes(1);
  });

  it('renders the timeline empty state and persisted entries', () => {
    const emptyScreen = render(
      <Timeline
        entries={[]}
        petName="Kiwi"
        colors={darkColors}
        onLog={jest.fn()}
        onExport={jest.fn()}
      />,
    );
    expect(emptyScreen.getByText('No events for Kiwi')).toBeTruthy();
    expect(emptyScreen.queryByText('Quick log')).toBeNull();
    expect(emptyScreen.getByLabelText('Add meal to timeline')).toBeTruthy();
    emptyScreen.unmount();

    const timelineScreen = render(
      <Timeline
        entries={[
          {
            id: 'event-1',
            icon: 'pulse-outline',
            title: 'Asthma logged',
            meta: 'Today · 10:30',
            note: 'Recovered quickly.',
            color: darkColors.coral,
          },
        ]}
        petName="Kiwi"
        colors={darkColors}
        onLog={jest.fn()}
        onExport={jest.fn()}
      />,
    );

    expect(timelineScreen.getByText('Asthma logged')).toBeTruthy();
    expect(timelineScreen.getByText('Recovered quickly.')).toBeTruthy();
  });
});
