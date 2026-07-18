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

    fireEvent.press(screen.getByText('Diet change'));

    expect(onLog).toHaveBeenCalledTimes(1);
  });

  it('renders the timeline empty state and persisted entries', () => {
    const emptyScreen = render(
      <Timeline
        entries={[]}
        petName="Kiwi"
        colors={darkColors}
        deletingEventId={null}
        onLog={jest.fn()}
        onExport={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(emptyScreen.getByText('No events for Kiwi')).toBeTruthy();
    expect(emptyScreen.queryByText('Quick log')).toBeNull();
    expect(emptyScreen.getByLabelText('Add diet change to timeline')).toBeTruthy();
    emptyScreen.unmount();

    const entry = {
      id: 'event-1',
      icon: 'pulse-outline' as const,
      title: 'Asthma logged',
      meta: 'Today · 10:30',
      note: 'Recovered quickly.',
      color: darkColors.coral,
    };
    const onDelete = jest.fn();
    const timelineScreen = render(
      <Timeline
        entries={[entry]}
        petName="Kiwi"
        colors={darkColors}
        deletingEventId={null}
        onLog={jest.fn()}
        onExport={jest.fn()}
        onDelete={onDelete}
      />,
    );

    expect(timelineScreen.getByText('Asthma logged')).toBeTruthy();
    expect(timelineScreen.getByText('Recovered quickly.')).toBeTruthy();
    fireEvent.press(
      timelineScreen.getByLabelText('Delete timeline event: Asthma logged, Today · 10:30'),
    );
    expect(onDelete).toHaveBeenCalledWith(entry);
  });

  it('disables timeline deletion while an event is being removed', () => {
    const onDelete = jest.fn();
    const screen = render(
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
        deletingEventId="event-1"
        onLog={jest.fn()}
        onExport={jest.fn()}
        onDelete={onDelete}
      />,
    );

    const deleteButton = screen.getByLabelText(
      'Delete timeline event: Asthma logged, Today · 10:30',
    );
    expect(deleteButton.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(deleteButton);
    expect(onDelete).not.toHaveBeenCalled();
  });
});
