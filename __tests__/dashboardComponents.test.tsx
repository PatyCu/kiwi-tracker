import { fireEvent, render } from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';

import { PetSelector } from '@/components/dashboard/PetSelector';
import { QuickLog } from '@/components/dashboard/QuickLog';
import { Timeline } from '@/components/dashboard/Timeline';
import { TodaySummary } from '@/components/dashboard/TodaySummary';
import { Pet } from '@/lib/pets';
import { PetStatusLevel } from '@/lib/petStatus';
import { darkColors } from '@/lib/theme';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name, ...props }: { name: string }) => React.createElement(Text, props, name),
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
  it.each([
    [PetStatusLevel.Red, darkColors.coral],
    [PetStatusLevel.Amber, darkColors.statusAmber],
    [PetStatusLevel.Green, darkColors.kiwi],
  ])('uses the %s status color for both the Today indicator and heart', (status, color) => {
    const screen = render(
      <TodaySummary
        pet={pets[0]}
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

  it('routes symptom and diet quick-log actions to their own flows', () => {
    const onLogSymptom = jest.fn();
    const onLogDietChange = jest.fn();
    const onLogOther = jest.fn();
    const screen = render(
      <QuickLog
        colors={darkColors}
        onLogSymptom={onLogSymptom}
        onLogDietChange={onLogDietChange}
        onLogOther={onLogOther}
      />,
    );

    fireEvent.press(screen.getByText('Symptom'));
    fireEvent.press(screen.getByText('Diet change'));
    fireEvent.press(screen.getByText('Other'));

    expect(onLogSymptom).toHaveBeenCalledTimes(1);
    expect(onLogDietChange).toHaveBeenCalledTimes(1);
    expect(onLogOther).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('button').map((button) => button.props.accessibilityLabel)).toEqual([
      'Add diet change to timeline',
      'Add environment to timeline',
      'Add symptom to timeline',
      'Add treatment to timeline',
      'Add other to timeline',
    ]);
    expect(screen.getByLabelText('Add environment to timeline').props.accessibilityState).toEqual({
      disabled: true,
    });
    expect(screen.getByLabelText('Add treatment to timeline').props.accessibilityState).toEqual({
      disabled: true,
    });
  });

  it('renders the timeline empty state and persisted entries', () => {
    const emptyScreen = render(
      <Timeline
        entries={[]}
        petName="Kiwi"
        colors={darkColors}
        deletingEventId={null}
        updatingEventId={null}
        onLogSymptom={jest.fn()}
        onLogDietChange={jest.fn()}
        onLogOther={jest.fn()}
        onExport={jest.fn()}
        onDelete={jest.fn()}
        onEditDateTime={jest.fn()}
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
      occurredAt: '2026-07-18T10:30:00.000Z',
      note: 'Recovered quickly.',
      color: darkColors.coral,
    };
    const onDelete = jest.fn();
    const onEditDateTime = jest.fn();
    const timelineScreen = render(
      <Timeline
        entries={[entry]}
        petName="Kiwi"
        colors={darkColors}
        deletingEventId={null}
        updatingEventId={null}
        onLogSymptom={jest.fn()}
        onLogDietChange={jest.fn()}
        onLogOther={jest.fn()}
        onExport={jest.fn()}
        onDelete={onDelete}
        onEditDateTime={onEditDateTime}
      />,
    );

    expect(timelineScreen.getByText('Asthma logged')).toBeTruthy();
    expect(timelineScreen.getByText('Recovered quickly.')).toBeTruthy();
    fireEvent.press(
      timelineScreen.getByLabelText('Delete timeline event: Asthma logged, Today · 10:30'),
    );
    expect(onDelete).toHaveBeenCalledWith(entry);
    fireEvent.press(
      timelineScreen.getByLabelText(
        'Edit date and time for Asthma logged, currently Today · 10:30',
      ),
    );
    expect(onEditDateTime).toHaveBeenCalledWith(entry);
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
            occurredAt: '2026-07-18T10:30:00.000Z',
            note: 'Recovered quickly.',
            color: darkColors.coral,
          },
        ]}
        petName="Kiwi"
        colors={darkColors}
        deletingEventId="event-1"
        updatingEventId={null}
        onLogSymptom={jest.fn()}
        onLogDietChange={jest.fn()}
        onLogOther={jest.fn()}
        onExport={jest.fn()}
        onDelete={onDelete}
        onEditDateTime={jest.fn()}
      />,
    );

    const deleteButton = screen.getByLabelText(
      'Delete timeline event: Asthma logged, Today · 10:30',
    );
    expect(deleteButton.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(deleteButton);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('reveals the timestamp edit treatment on web hover', () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });

    try {
      const screen = render(
        <Timeline
          entries={[
            {
              id: 'event-1',
              icon: 'pulse-outline',
              title: 'Asthma logged',
              meta: 'Today · 10:30',
              occurredAt: '2026-07-18T10:30:00.000Z',
              color: darkColors.coral,
            },
          ]}
          petName="Kiwi"
          colors={darkColors}
          deletingEventId={null}
          updatingEventId={null}
          onLogSymptom={jest.fn()}
          onLogDietChange={jest.fn()}
          onLogOther={jest.fn()}
          onExport={jest.fn()}
          onDelete={jest.fn()}
          onEditDateTime={jest.fn()}
        />,
      );
      const timestamp = screen.getByTestId('timeline-event-meta-event-1');

      expect(screen.getByTestId('timeline-event-edit-icon-event-1').props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ opacity: 0 })]),
      );
      fireEvent(timestamp, 'hoverIn');

      expect(screen.getByTestId('timeline-event-edit-icon-event-1').props.style).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ opacity: 0 })]),
      );
      expect(screen.getByTestId('timeline-event-meta-text-event-1').props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ textDecorationLine: 'underline' })]),
      );
    } finally {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
    }
  });
});
