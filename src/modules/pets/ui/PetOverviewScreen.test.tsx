import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { loadPetEvents } from '@/modules/pet-events/persistence/petEventStore';
import { CalendarEventFormsProvider } from '@/modules/calendar-events/state/CalendarEventFormsProvider';
import { CalendarEventsProvider } from '@/modules/calendar-events/state/CalendarEventsProvider';
import { PetEventFormsProvider } from '@/modules/pet-events/state/PetEventFormsProvider';
import { PetEventsProvider } from '@/modules/pet-events/state/PetEventsProvider';
import { loadPets } from '@/modules/pets/persistence/petStore';
import { PetProfileFormsProvider } from '@/modules/pets/state/PetProfileFormsProvider';
import { PetsProvider } from '@/modules/pets/state/PetsProvider';
import { PetOverviewScreen } from '@/modules/pets/ui/PetOverviewScreen';
import { AppearanceProvider } from '@/shared/theme/AppearanceProvider';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, ...props }: { name: string }) => React.createElement(Text, props, name),
  };
});

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: () => ({ petId: 'luna' }),
}));

jest.mock('@/modules/auth/state/SessionProvider', () => ({
  useSession: () => ({
    session: { status: 'signed-in', user: { id: 'alex', email: 'alex@kiwi.test' } },
    signOut: jest.fn(),
  }),
}));

jest.mock('@/modules/households/state/HouseholdProvider', () => ({
  useHousehold: () => ({
    household: { status: 'ready', id: 'alexs-home', alias: "Alex's home" },
    retryLoad: jest.fn(),
  }),
}));

jest.mock('@/modules/pets/persistence/petStore', () => ({
  loadPets: jest.fn(),
  insertPet: jest.fn(),
  updatePet: jest.fn(),
}));
jest.mock('@/modules/pets/persistence/petPhotoStore', () => ({
  PET_PHOTO_LINK_LIFETIME_SECONDS: 3600,
  withPhotoLinks: jest.fn(async (pets: unknown) => pets),
}));
jest.mock('@/modules/pet-events/persistence/petEventStore', () => ({
  loadPetEvents: jest.fn(),
  insertPetEvent: jest.fn(),
  updatePetEvent: jest.fn(),
  deletePetEvent: jest.fn(),
}));

jest.mock('@/modules/calendar-events/persistence/calendarEventStore', () => ({
  loadCalendarEvents: jest.fn(async () => []),
  insertCalendarEvent: jest.fn(),
}));

function Providers({ children }: { children: ReactNode }) {
  return (
    <AppearanceProvider>
      <PetsProvider>
        <PetEventsProvider>
          <CalendarEventsProvider>
            <PetProfileFormsProvider>
              <PetEventFormsProvider>
                <CalendarEventFormsProvider>{children}</CalendarEventFormsProvider>
              </PetEventFormsProvider>
            </PetProfileFormsProvider>
          </CalendarEventsProvider>
        </PetEventsProvider>
      </PetsProvider>
    </AppearanceProvider>
  );
}

describe('Pet overview screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(loadPetEvents).mockResolvedValue([]);
  });

  it('shows a loading state, not "Pet not found", while a deep-linked pet loads', async () => {
    jest.mocked(loadPets).mockResolvedValue([{ id: 'luna', name: 'Luna', species: 'Dog' }]);

    const screen = render(<PetOverviewScreen />, { wrapper: Providers });

    expect(screen.getByLabelText('Loading')).toBeTruthy();
    expect(screen.queryByText('Pet not found')).toBeNull();
    await waitFor(() => expect(screen.getByText('Today with Luna')).toBeTruthy());
  });

  it('shows an error with a working Retry when the pets fail to load', async () => {
    jest
      .mocked(loadPets)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([{ id: 'luna', name: 'Luna', species: 'Dog' }]);

    const screen = render(<PetOverviewScreen />, { wrapper: Providers });

    await waitFor(() => expect(screen.getByText('Could not load your data')).toBeTruthy());
    expect(screen.queryByText('Pet not found')).toBeNull();
    fireEvent.press(screen.getByText('Retry'));

    await waitFor(() => expect(screen.getByText('Today with Luna')).toBeTruthy());
  });
});
