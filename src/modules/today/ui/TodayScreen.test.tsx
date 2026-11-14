import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { AppearanceProvider } from '@/shared/theme/AppearanceProvider';
import { insertCalendarEvent } from '@/modules/calendar-events/persistence/calendarEventStore';
import { CalendarEventFormsProvider } from '@/modules/calendar-events/state/CalendarEventFormsProvider';
import { CalendarEventsProvider } from '@/modules/calendar-events/state/CalendarEventsProvider';
import { PetEvent } from '@/modules/pet-events/model/PetEvent';
import { insertPetEvent, loadPetEvents } from '@/modules/pet-events/persistence/petEventStore';
import { PetEventFormsProvider } from '@/modules/pet-events/state/PetEventFormsProvider';
import { PetEventsProvider } from '@/modules/pet-events/state/PetEventsProvider';
import { PetProfileFormsProvider } from '@/modules/pets/state/PetProfileFormsProvider';
import { Pet } from '@/modules/pets/model/Pet';
import { insertPet, loadPets } from '@/modules/pets/persistence/petStore';
import { PetsProvider } from '@/modules/pets/state/PetsProvider';
import { useHouseholdAlias } from '@/modules/households/state/useHouseholdAlias';
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

jest.mock('@/modules/households/state/useHouseholdAlias', () => ({
  useHouseholdAlias: jest.fn(() => null),
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

const kiwi: Pet = { id: 'kiwi', name: 'Kiwi', species: 'Cat' };
const luna: Pet = { id: 'luna', name: 'Luna', species: 'Dog' };
const mockedLoadPets = jest.mocked(loadPets);
const mockedLoadEvents = jest.mocked(loadPetEvents);
const mockedInsertEvent = jest.mocked(insertPetEvent);

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

describe('Today screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useHouseholdAlias).mockReturnValue(null);
    mockedLoadPets.mockResolvedValue([kiwi]);
    mockedLoadEvents.mockResolvedValue([]);
    mockedInsertEvent.mockImplementation(
      async (event) =>
        ({ ...event, id: 'saved-event', createdAt: new Date().toISOString() }) as PetEvent,
    );
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
    expect(screen.getByText("Calendar events aren't shown yet")).toBeTruthy();
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

  it('shows a loading state, not the empty state, until pets and events have loaded', async () => {
    let finishEvents: (events: PetEvent[]) => void = () => undefined;
    mockedLoadEvents.mockReturnValue(new Promise((resolve) => (finishEvents = resolve)));
    mockedLoadPets.mockResolvedValue([]);

    const screen = render(<TodayScreen />, { wrapper: Providers });

    await waitFor(() => expect(mockedLoadPets).toHaveBeenCalled());
    expect(screen.getByLabelText('Loading')).toBeTruthy();
    expect(screen.queryByText('No pets yet')).toBeNull();
    await act(async () => finishEvents([]));
    expect(screen.getByText('No pets yet')).toBeTruthy();
  });

  it('shows an error after a failed load and retries only what failed', async () => {
    mockedLoadEvents.mockRejectedValueOnce(new Error('offline'));

    const screen = render(<TodayScreen />, { wrapper: Providers });

    await waitFor(() => expect(screen.getByText('Could not load your data')).toBeTruthy());
    fireEvent.press(screen.getByText('Retry'));

    await waitFor(() => expect(screen.getByText('Today with Kiwi')).toBeTruthy());
    expect(mockedLoadEvents).toHaveBeenCalledTimes(2);
    expect(mockedLoadPets).toHaveBeenCalledTimes(1);
  });

  it('adds the first pet from the empty state when the household has none yet', async () => {
    mockedLoadPets.mockResolvedValue([]);
    jest.mocked(insertPet).mockResolvedValue({ id: 'miso', name: 'Miso', species: 'Cat' });

    const screen = render(<TodayScreen />, { wrapper: Providers });

    await waitFor(() => expect(screen.getByText('No pets yet')).toBeTruthy());
    expect(screen.queryByText('Add event')).toBeNull();
    fireEvent.press(screen.getByText('Add your first pet'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Miso'), 'Miso');
    fireEvent.press(screen.getByText('Add pet'));

    await waitFor(() => expect(screen.getByText('Today with Miso')).toBeTruthy());
    expect(insertPet).toHaveBeenCalledWith(
      'alexs-home',
      expect.objectContaining({ name: 'Miso', species: 'Cat' }),
    );
    expect(screen.queryByText('No pets yet')).toBeNull();
    expect(screen.getByText('Add event')).toBeTruthy();
  });

  it('names the household in the summary card once its alias loads', async () => {
    jest.mocked(useHouseholdAlias).mockReturnValue('The Burrow');

    const screen = render(<TodayScreen />, { wrapper: Providers });

    await waitFor(() => expect(screen.getByText('Today in The Burrow')).toBeTruthy());
    expect(screen.queryByText('Today with Kiwi')).toBeNull();
  });

  it('renders one aggregate semaphore card for multiple persisted pets', async () => {
    mockedLoadPets.mockResolvedValue([kiwi, luna]);

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
    expect(mockedInsertEvent).toHaveBeenCalledWith(
      expect.objectContaining({ petId: 'kiwi', type: 'diet-change' }),
    );
  });

  it('attaches an event from the Today bar to the selected pet', async () => {
    mockedLoadPets.mockResolvedValue([kiwi, luna]);

    const screen = render(<TodayScreen />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText('Today with Kiwi and Luna')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Add diet change to timeline'));
    expect(screen.getByText('PET')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Select Luna'));
    fireEvent.changeText(screen.getByLabelText('Diet product name'), 'Luna sensitive food');
    fireEvent.press(screen.getByText('Save diet change'));

    await waitFor(() =>
      expect(mockedInsertEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          petId: 'luna',
          change: expect.objectContaining({
            item: expect.objectContaining({ productName: 'Luna sensitive food' }),
          }),
        }),
      ),
    );
  });

  it('preserves the red semaphore copy in the global attention view', async () => {
    const now = new Date();
    mockedLoadEvents.mockResolvedValue([
      {
        id: 'symptom-1',
        petId: 'kiwi',
        type: 'symptom',
        symptom: 'Diarrhea',
        occurredAt: now.toISOString(),
        createdAt: now.toISOString(),
      },
    ] as PetEvent[]);
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
    mockedLoadPets.mockResolvedValue([kiwi, luna]);
    mockedLoadEvents.mockResolvedValue([
      {
        id: 'symptom-1',
        petId: 'luna',
        type: 'symptom',
        symptom: 'Diarrhea',
        occurredAt: now.toISOString(),
        createdAt: now.toISOString(),
      },
    ] as PetEvent[]);

    const screen = render(<TodayScreen />, { wrapper: Providers });

    await waitFor(() => expect(screen.getByText('Something needs your attention.')).toBeTruthy());
    const insightNames = screen.getAllByText(/^(Kiwi|Luna)$/).map((node) => node.props.children);
    expect(insightNames).toEqual(['Luna', 'Kiwi']);
    expect(screen.getByLabelText('Kiwi: All good, nothing to see here.')).toBeTruthy();
  });

  it('lists repeated status reasons without duplicate React keys', async () => {
    const occurredAt = new Date().toISOString();
    const item = { id: 'item-1', productName: 'Royal Canin', foodType: 'dry-food' };
    mockedLoadEvents.mockResolvedValue([
      {
        id: 'diet-add',
        petId: 'kiwi',
        type: 'diet-change',
        change: { type: 'add', item },
        occurredAt,
        createdAt: occurredAt,
      },
      {
        id: 'diet-remove',
        petId: 'kiwi',
        type: 'diet-change',
        change: { type: 'remove', item },
        occurredAt,
        createdAt: occurredAt,
      },
    ] as PetEvent[]);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const screen = render(<TodayScreen />, { wrapper: Providers });

    await waitFor(() =>
      expect(
        screen.getAllByText('Diet changed today. Keep an eye out for new symptoms.'),
      ).toHaveLength(2),
    );
    expect(consoleError.mock.calls.flat().join(' ')).not.toContain('same key');
    consoleError.mockRestore();
  });

  it('adds a calendar event for the pet chosen in the form', async () => {
    mockedLoadPets.mockResolvedValue([kiwi, luna]);
    jest.mocked(insertCalendarEvent).mockImplementation(async (event) => ({
      ...event,
      id: 'calendar-1',
      createdAt: new Date().toISOString(),
    }));

    const screen = render(<TodayScreen />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText('Today with Kiwi and Luna')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Schedule calendar event'));
    expect(screen.getByText('PET')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Select Luna'));
    fireEvent.changeText(screen.getByLabelText('Calendar event title'), 'Annual vaccines');
    fireEvent.changeText(screen.getByLabelText('Calendar event location'), ' Riverside Vet ');
    fireEvent.press(screen.getByText('Save event'));

    await waitFor(() =>
      expect(insertCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          petId: 'luna',
          title: 'Annual vaccines',
          location: 'Riverside Vet',
        }),
      ),
    );
    await waitFor(() => expect(screen.queryByLabelText('Calendar event title')).toBeNull());
  });

  it('adds a calendar event for the only pet without asking which one', async () => {
    const screen = render(<TodayScreen />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText('Today with Kiwi')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Schedule calendar event'));

    expect(screen.getByLabelText('Calendar event title')).toBeTruthy();
    expect(screen.queryByText('PET')).toBeNull();
  });
});
