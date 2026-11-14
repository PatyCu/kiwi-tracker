import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { ReactNode } from 'react';

import { CalendarEvent } from '@/modules/calendar-events/model/CalendarEvent';
import { loadCalendarEvents } from '@/modules/calendar-events/persistence/calendarEventStore';
import { CalendarEventsProvider } from '@/modules/calendar-events/state/CalendarEventsProvider';
import { CalendarScreen } from '@/modules/calendar/ui/CalendarScreen';
import { PetEvent } from '@/modules/pet-events/model/PetEvent';
import { loadPetEvents } from '@/modules/pet-events/persistence/petEventStore';
import { PetEventsProvider } from '@/modules/pet-events/state/PetEventsProvider';
import { Pet } from '@/modules/pets/model/Pet';
import { loadPets } from '@/modules/pets/persistence/petStore';
import { PetProfileFormsProvider } from '@/modules/pets/state/PetProfileFormsProvider';
import { PetsProvider } from '@/modules/pets/state/PetsProvider';
import { formatCompactClockTime } from '@/shared/dates/dateTime';
import { AppearanceProvider } from '@/shared/theme/AppearanceProvider';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, ...props }: { name: string }) => React.createElement(Text, props, name),
  };
});

let mockWindowWidth = 375;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: mockWindowWidth, height: 800, scale: 1, fontScale: 1 }),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
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
  loadCalendarEvents: jest.fn(),
  insertCalendarEvent: jest.fn(),
}));

const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;
const kiwi: Pet = { id: 'kiwi', name: 'Kiwi', species: 'Cat' };
const luna: Pet = { id: 'luna', name: 'Luna', species: 'Dog' };
const createdAt = '2026-11-01T10:00:00.000Z';

/** Today at the given hour, so the items land in the month the calendar opens on. */
function today(hour: number): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

const vomiting: PetEvent = {
  id: 'vomiting',
  petId: 'kiwi',
  type: 'symptom',
  symptom: 'Vomiting',
  occurredAt: today(8),
  createdAt,
};
const groomer: PetEvent = {
  id: 'groomer',
  petId: 'luna',
  type: 'other',
  title: 'Groomer',
  occurredAt: today(9),
  createdAt,
};
const vaccines: CalendarEvent = {
  id: 'vaccines',
  petId: 'luna',
  title: 'Vaccines',
  startsAt: today(15),
  endsAt: today(16),
  location: 'Riverside Vet',
  createdAt,
};

function Providers({ children }: { children: ReactNode }) {
  return (
    <AppearanceProvider>
      <PetsProvider>
        <PetEventsProvider>
          <CalendarEventsProvider>
            <PetProfileFormsProvider>{children}</PetProfileFormsProvider>
          </CalendarEventsProvider>
        </PetEventsProvider>
      </PetsProvider>
    </AppearanceProvider>
  );
}

async function renderCalendar() {
  const screen = render(<CalendarScreen />, { wrapper: Providers });
  await waitFor(() => expect(screen.getByLabelText('Next month')).toBeTruthy());
  return screen;
}

describe('Calendar screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowWidth = 375;
    jest.mocked(useLocalSearchParams).mockReturnValue({});
    jest.mocked(loadPets).mockResolvedValue([kiwi, luna]);
    jest.mocked(loadPetEvents).mockResolvedValue([groomer, vomiting]);
    jest.mocked(loadCalendarEvents).mockResolvedValue([vaccines]);
  });

  it("lists today's pet events and calendar events, earliest first, on narrow screens", async () => {
    const screen = await renderCalendar();

    const titles = screen
      .getAllByText(/^(Vomiting logged|Groomer|Vaccines)$/)
      .map((node) => node.props.children);
    expect(titles).toEqual(['Vomiting logged', 'Groomer', 'Vaccines']);
    expect(screen.getByText('Luna · Riverside Vet')).toBeTruthy();
    expect(screen.getByText('Kiwi')).toBeTruthy();
  });

  it('filters by kind', async () => {
    const screen = await renderCalendar();

    const dayHeader = () => screen.getByRole('header', { name: /^\d+ \w+ – |^\w+ \d+ – / });
    expect(dayHeader()).toHaveTextContent(/– All events$/);

    fireEvent.press(screen.getByLabelText('Calendar events'));
    expect(screen.queryByText('Groomer')).toBeNull();
    expect(dayHeader()).toHaveTextContent(/– Calendar events$/);
    expect(screen.getByText('Vaccines')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Pet events'));
    expect(screen.getByText('Groomer')).toBeTruthy();
    expect(screen.queryByText('Vaccines')).toBeNull();
    expect(screen.getByLabelText('Pet events').props.accessibilityState).toEqual({ checked: true });

    fireEvent.press(screen.getByLabelText('All events'));
    expect(screen.getByText('Vaccines')).toBeTruthy();
  });

  it('selects every pet by default and turns one off through the route', async () => {
    const screen = await renderCalendar();

    expect(screen.getByLabelText('Kiwi').props.accessibilityState).toEqual({ checked: true });
    expect(screen.getByLabelText('Luna').props.accessibilityState).toEqual({ checked: true });

    fireEvent.press(screen.getByLabelText('Kiwi'));
    expect(router.setParams).toHaveBeenCalledWith({ petIds: 'luna' });
  });

  it("shows only the pets in the route, without repeating a single pet's name", async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ petIds: 'luna' });
    const screen = await renderCalendar();

    expect(screen.queryByText('Vomiting logged')).toBeNull();
    expect(screen.getByText('Groomer')).toBeTruthy();
    expect(screen.getByText('Riverside Vet')).toBeTruthy();
    expect(screen.getByLabelText('Kiwi').props.accessibilityState).toEqual({ checked: false });

    fireEvent.press(screen.getByLabelText('Kiwi'));
    expect(router.setParams).toHaveBeenCalledWith({ petIds: undefined });

    router.setParams.mockClear();
    fireEvent.press(screen.getByLabelText('Luna'));
    expect(router.setParams).toHaveBeenCalledWith({ petIds: 'luna' });
  });

  it('hides the pet switch when the household has one pet', async () => {
    jest.mocked(loadPets).mockResolvedValue([kiwi]);
    const screen = await renderCalendar();

    expect(screen.queryByLabelText('Pets shown')).toBeNull();
  });

  it('opens a pet event inside the Calendar tab, but not a calendar event', async () => {
    const screen = await renderCalendar();

    fireEvent.press(screen.getByText('Groomer'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/calendar/[petId]/records/[recordId]',
      params: { petId: 'luna', recordId: 'groomer' },
    });

    router.push.mockClear();
    fireEvent.press(screen.getByText('Vaccines'));
    expect(router.push).not.toHaveBeenCalled();
  });

  it('shows another day, and says when nothing happened on it', async () => {
    const screen = await renderCalendar();
    // Moving a month always selects a day without items in these tests.
    fireEvent.press(screen.getByLabelText('Next month'));

    expect(screen.getByText('Nothing logged or scheduled on this day.')).toBeTruthy();
    expect(screen.queryByText('Groomer')).toBeNull();
  });

  it('shows the month as a grid on wide screens, with the extra items counted', async () => {
    mockWindowWidth = 1280;
    jest
      .mocked(loadPetEvents)
      .mockResolvedValue([
        groomer,
        vomiting,
        { ...groomer, id: 'walk', title: 'Walk', occurredAt: today(10) },
      ]);
    const screen = await renderCalendar();

    expect(screen.getByText('MON')).toBeTruthy();
    expect(
      screen.getByLabelText(`${formatCompactClockTime(today(8))} Vomiting logged · Kiwi`),
    ).toBeTruthy();
    expect(screen.queryByText('Vaccines · Luna')).toBeNull();
    expect(screen.getByText('+1 more')).toBeTruthy();
  });

  it('reports a failed load and loads the calendar events again on retry', async () => {
    jest.mocked(loadCalendarEvents).mockRejectedValueOnce(new Error('offline'));
    const screen = render(<CalendarScreen />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText('Retry')).toBeTruthy());

    fireEvent.press(screen.getByText('Retry'));

    await waitFor(() => expect(screen.getByText('Groomer')).toBeTruthy());
    expect(loadCalendarEvents).toHaveBeenCalledTimes(2);
    expect(loadPetEvents).toHaveBeenCalledTimes(1);
  });

  it('asks for a first pet when the household has none', async () => {
    jest.mocked(loadPets).mockResolvedValue([]);
    const screen = render(<CalendarScreen />, { wrapper: Providers });

    await waitFor(() =>
      expect(
        screen.getByText('Add a pet to see what you log and schedule for them by month.'),
      ).toBeTruthy(),
    );
  });
});
