import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { SessionState, useSession } from '@/modules/auth/state/SessionProvider';
import { useHousehold } from '@/modules/households/state/HouseholdProvider';
import { clearCachedPetPhotos } from '@/modules/pets/media/petPhotoCache';
import { Pet } from '@/modules/pets/model/Pet';
import { withPhotoLinks } from '@/modules/pets/persistence/petPhotoStore';
import { loadPets } from '@/modules/pets/persistence/petStore';
import { PetsProvider, usePets } from '@/modules/pets/state/PetsProvider';

jest.mock('@/modules/auth/state/SessionProvider', () => ({ useSession: jest.fn() }));
jest.mock('@/modules/households/state/HouseholdProvider', () => ({ useHousehold: jest.fn() }));
jest.mock('@/modules/pets/persistence/petStore', () => ({ loadPets: jest.fn() }));
jest.mock('@/modules/pets/media/petPhotoCache', () => ({ clearCachedPetPhotos: jest.fn() }));
jest.mock('@/modules/pets/persistence/petPhotoStore', () => ({
  PET_PHOTO_LINK_LIFETIME_SECONDS: 3600,
  withPhotoLinks: jest.fn(),
}));

const mockedLoad = jest.mocked(loadPets);
const mockedLink = jest.mocked(withPhotoLinks);
const kiwi: Pet = { id: 'kiwi', name: 'Kiwi', species: 'Cat', photoPath: 'kiwi/photo' };
const wrapper = ({ children }: { children: ReactNode }) => <PetsProvider>{children}</PetsProvider>;
const MINUTE = 60 * 1000;

let signings = 0;
function linkAs(link: (count: number) => string) {
  mockedLink.mockImplementation(async (pets) => {
    signings += 1;
    return pets.map((pet) => (pet.photoPath ? { ...pet, photoUri: link(signings) } : pet));
  });
}

describe('PetsProvider photo links', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    signings = 0;
    const session: SessionState = {
      status: 'signed-in',
      user: { id: 'alex', email: 'alex@kiwi.test' },
    };
    jest.mocked(useSession).mockReturnValue({ session, signOut: jest.fn() });
    jest.mocked(useHousehold).mockReturnValue({
      household: { status: 'ready', id: 'alexs-home', alias: "Alex's home" },
    } as ReturnType<typeof useHousehold>);
    mockedLoad.mockResolvedValue([kiwi]);
    jest.mocked(clearCachedPetPhotos).mockResolvedValue();
  });

  afterEach(() => jest.useRealTimers());

  it('signs photo links on load and again 10 minutes before they expire', async () => {
    linkAs((count) => `https://link/${count}`);
    const { result } = renderHook(() => usePets(), { wrapper });

    await waitFor(() => expect(result.current.pets[0]?.photoUri).toBe('https://link/1'));

    await act(async () => jest.advanceTimersByTime(49 * MINUTE));
    expect(result.current.pets[0].photoUri).toBe('https://link/1');

    await act(async () => jest.advanceTimersByTime(MINUTE));
    expect(result.current.pets[0].photoUri).toBe('https://link/2');
  });

  it('shows pets without photos when signing fails, and retries a minute later', async () => {
    mockedLink
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce(new Error('again'));
    const { result } = renderHook(() => usePets(), { wrapper });

    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    expect(result.current.pets).toEqual([kiwi]);

    await act(async () => jest.advanceTimersByTime(MINUTE));
    expect(mockedLink).toHaveBeenCalledTimes(2);

    linkAs(() => 'https://link/ok');
    await act(async () => jest.advanceTimersByTime(MINUTE));
    expect(result.current.pets[0].photoUri).toBe('https://link/ok');
  });

  it('clears cached photos when the user signs out, and not while signed in', async () => {
    linkAs(() => 'https://link');
    const { rerender } = renderHook(() => usePets(), { wrapper });
    await waitFor(() => expect(mockedLink).toHaveBeenCalled());
    expect(clearCachedPetPhotos).not.toHaveBeenCalled();

    jest.mocked(useSession).mockReturnValue({
      session: { status: 'signed-out' },
      signOut: jest.fn(),
    });
    rerender({});

    expect(clearCachedPetPhotos).toHaveBeenCalledTimes(1);
  });
});
