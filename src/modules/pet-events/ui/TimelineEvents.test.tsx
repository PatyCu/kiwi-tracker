import { fireEvent, render } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { TimelineEvents } from '@/modules/pet-events/ui/TimelineEvents';
import { darkColors } from '@/shared/theme/palette';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name, ...props }: { name: string }) => React.createElement(Text, props, name),
  };
});

describe('TimelineEvents', () => {
  it('renders the timeline empty state and persisted entries', () => {
    const emptyScreen = render(
      <TimelineEvents
        entries={[]}
        petName="Kiwi"
        colors={darkColors}
        deletingEventId={null}
        updatingEventId={null}
        onDelete={jest.fn()}
        onEditDateTime={jest.fn()}
      />,
    );
    expect(emptyScreen.getByText('No events for Kiwi')).toBeTruthy();
    expect(emptyScreen.queryByText('Quick log')).toBeNull();
    emptyScreen.unmount();

    const entry = {
      id: 'event-1',
      petId: 'kiwi',
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
      <TimelineEvents
        entries={[entry]}
        petName="Kiwi"
        colors={darkColors}
        deletingEventId={null}
        updatingEventId={null}
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
      <TimelineEvents
        entries={[
          {
            id: 'event-1',
            petId: 'kiwi',
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
        <TimelineEvents
          entries={[
            {
              id: 'event-1',
              petId: 'kiwi',
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
