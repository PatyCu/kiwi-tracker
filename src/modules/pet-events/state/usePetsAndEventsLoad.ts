import { useCallback } from 'react';

import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { combineLoadStatus, LoadStatus } from '@/shared/state/LoadStatus';

/**
 * Whether both the household's pets and its events have loaded, for screens
 * that show both. Retry loads again only what failed, so loaded data stays put.
 */
export function usePetsAndEventsLoad(): { loadStatus: LoadStatus; retryLoad: () => void } {
  const { loadStatus: petsStatus, retryLoad: retryPets } = usePets();
  const { loadStatus: eventsStatus, retryLoad: retryEvents } = usePetEvents();

  const retryLoad = useCallback(() => {
    if (petsStatus === 'error') retryPets();
    if (eventsStatus === 'error') retryEvents();
  }, [eventsStatus, petsStatus, retryEvents, retryPets]);

  return { loadStatus: combineLoadStatus(petsStatus, eventsStatus), retryLoad };
}
