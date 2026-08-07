import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { AppearanceProvider } from '@/shared/theme/AppearanceProvider';
import { PetEventFormsProvider } from '@/modules/pet-events/state/PetEventFormsProvider';
import { PetEventsProvider } from '@/modules/pet-events/state/PetEventsProvider';
import { PetProfileFormsProvider } from '@/modules/pets/state/PetProfileFormsProvider';
import { PetsProvider } from '@/modules/pets/state/PetsProvider';
import { TodayScreen } from '@/modules/today/ui/TodayScreen';
import { lightColors } from '@/shared/theme/palette';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, ...props }: { name: string }) => React.createElement(Text, props, name),
  };
});

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const storage = jest.mocked(AsyncStorage);

function Providers({ children }: { children: ReactNode }) {
  return (
    <AppearanceProvider>
      <PetsProvider>
        <PetEventsProvider>
          <PetProfileFormsProvider>
            <PetEventFormsProvider>{children}</PetEventFormsProvider>
          </PetProfileFormsProvider>
        </PetEventsProvider>
      </PetsProvider>
    </AppearanceProvider>
  );
}

describe('Today screen', () => {
  beforeEach(() => {
    storage.clear();
    jest.clearAllMocks();
  });

  it('shows the original semaphore card with truthful care placeholders', async () => {
    const screen = render(<TodayScreen />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText('Today with Kiwi')).toBeTruthy());
    expect(screen.getByText('Everything looks calm.')).toBeTruthy();
    expect(screen.getByText('No recent symptoms or changes to review.')).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByTestId('today-status-indicator').props.style),
    ).toMatchObject({ borderColor: lightColors.kiwi });
    expect(screen.getByTestId('today-status-icon').props).toMatchObject({
      color: lightColors.kiwi,
      children: 'heart',
    });
    expect(screen.getByLabelText('Kiwi avatar')).toBeTruthy();
    expect(screen.getByText('All good, nothing to see here.')).toBeTruthy();
    expect(screen.getByText('No calendar events yet')).toBeTruthy();
    expect(screen.getByText('No overdue items')).toBeTruthy();
    expect(screen.getByText('Add event')).toBeTruthy();
    expect(screen.queryByText('Needs attention')).toBeNull();
    expect(screen.queryByText('Upcoming')).toBeNull();
    expect(screen.getAllByText('Overdue')).toHaveLength(1);
    expect(screen.queryByText('Updates')).toBeNull();
    expect(screen.queryByText('Not available yet')).toBeNull();
    expect(screen.queryByText('Last 24 hours')).toBeNull();
    expect(screen.queryByText('Recent updates')).toBeNull();
    expect(screen.queryByLabelText('Quick log')).toBeNull();
  });

  it('renders one aggregate semaphore card for multiple persisted pets', async () => {
    await storage.setItem(
      '@kiwi-tracker/pet-state/v2',
      JSON.stringify({
        version: 2,
        activePetId: 'kiwi',
        pets: [
          {
            id: 'kiwi',
            name: 'Kiwi',
            species: 'Cat',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
          {
            id: 'luna',
            name: 'Luna',
            species: 'Dog',
            createdAt: '2025-01-02T00:00:00.000Z',
          },
        ],
      }),
    );

    const screen = render(<TodayScreen />, { wrapper: Providers });

    await waitFor(() => expect(screen.getByText('Today with Kiwi and Luna')).toBeTruthy());
    expect(screen.getByText('PETS')).toBeTruthy();
    expect(screen.getAllByTestId('today-summary-card')).toHaveLength(1);
    expect(screen.getAllByLabelText('Kiwi avatar').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Luna avatar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('All good, nothing to see here.')).toHaveLength(2);
    expect(screen.queryByText('Today with Kiwi')).toBeNull();
    expect(screen.queryByText('Today with Luna')).toBeNull();
  });

  it('quick-logs a diet change for an explicit pet and updates Today', async () => {
    const screen = render(<TodayScreen />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText('Today with Kiwi')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Add diet change to timeline'));
    fireEvent.changeText(screen.getByLabelText('Diet product name'), 'Greenies Dental chew');
    fireEvent.press(screen.getByText('Save diet change'));

    await waitFor(() => expect(screen.getByText('Something to keep an eye on.')).toBeTruthy());
    await expect(storage.getItem('@kiwi-tracker/timeline-events/v1')).resolves.toContain(
      'diet-change',
    );
  });

  it('attaches an event from the Today bar to the selected pet', async () => {
    await storage.setItem(
      '@kiwi-tracker/pet-state/v2',
      JSON.stringify({
        version: 2,
        activePetId: 'kiwi',
        pets: [
          {
            id: 'kiwi',
            name: 'Kiwi',
            species: 'Cat',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
          {
            id: 'luna',
            name: 'Luna',
            species: 'Dog',
            createdAt: '2025-01-02T00:00:00.000Z',
          },
        ],
      }),
    );

    const screen = render(<TodayScreen />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText('Today with Kiwi and Luna')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Add diet change to timeline'));
    expect(screen.getByText('PET')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Select Luna'));
    fireEvent.changeText(screen.getByLabelText('Diet product name'), 'Luna sensitive food');
    fireEvent.press(screen.getByText('Save diet change'));

    await waitFor(async () => {
      const savedEvents = await storage.getItem('@kiwi-tracker/timeline-events/v1');
      expect(savedEvents).toContain('"petId":"luna"');
      expect(savedEvents).toContain('Luna sensitive food');
    });
  });

  it('preserves the red semaphore copy in the global attention view', async () => {
    const now = new Date();
    await storage.setItem(
      '@kiwi-tracker/timeline-events/v1',
      JSON.stringify([
        {
          id: 'symptom-1',
          petId: 'kiwi',
          type: 'symptom',
          symptom: 'Diarrhea',
          occurredAt: now.toISOString(),
          recordedAt: now.toISOString(),
        },
      ]),
    );
    const screen = render(<TodayScreen />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText('Something needs your attention.')).toBeTruthy());
    expect(screen.getByText(/Diarrhea was logged today/)).toBeTruthy();
    const radarItem = screen.getByLabelText(/Kiwi: Diarrhea was logged today/);
    fireEvent.press(radarItem);
    expect(jest.requireMock('expo-router').router.push).toHaveBeenCalledWith({
      pathname: '/pets',
      params: { petId: 'kiwi' },
    });
    expect(
      StyleSheet.flatten(screen.getByTestId('today-status-indicator').props.style),
    ).toMatchObject({ borderColor: lightColors.coral });
  });

  it('shows alert entries before pets with nothing to report', async () => {
    const now = new Date();
    await storage.setItem(
      '@kiwi-tracker/pet-state/v2',
      JSON.stringify({
        version: 2,
        activePetId: 'kiwi',
        pets: [
          {
            id: 'kiwi',
            name: 'Kiwi',
            species: 'Cat',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
          {
            id: 'luna',
            name: 'Luna',
            species: 'Dog',
            createdAt: '2025-01-02T00:00:00.000Z',
          },
        ],
      }),
    );
    await storage.setItem(
      '@kiwi-tracker/timeline-events/v1',
      JSON.stringify([
        {
          id: 'symptom-1',
          petId: 'luna',
          type: 'symptom',
          symptom: 'Diarrhea',
          occurredAt: now.toISOString(),
          recordedAt: now.toISOString(),
        },
      ]),
    );

    const screen = render(<TodayScreen />, { wrapper: Providers });

    await waitFor(() => expect(screen.getByText('Something needs your attention.')).toBeTruthy());
    const insightNames = screen.getAllByText(/^(Kiwi|Luna)$/).map((node) => node.props.children);
    expect(insightNames).toEqual(['Luna', 'Kiwi']);
    expect(screen.getByLabelText('Kiwi: All good, nothing to see here.')).toBeTruthy();
  });
});
