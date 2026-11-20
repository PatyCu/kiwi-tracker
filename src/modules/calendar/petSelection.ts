import { toggleSelection } from '@/modules/calendar/filterSelection';
import { Pet } from '@/modules/pets/model/Pet';

/**
 * Which pets the calendar shows, kept in the route as a comma-separated
 * `petIds` parameter. No parameter means every pet, so a plain link shows all.
 */

/** The selected pet ids, in the household's pet order. Unknown ids are ignored; none left means every pet. */
export function readPetSelection(param: string | undefined, pets: readonly Pet[]): string[] {
  const requested = new Set(param?.split(',') ?? []);
  const selected = pets.filter((pet) => requested.has(pet.id)).map((pet) => pet.id);
  return selected.length > 0 ? selected : pets.map((pet) => pet.id);
}

/** Turns one pet on or off. The last selected pet stays on. */
export function togglePetSelection(
  selected: readonly string[],
  petId: string,
  pets: readonly Pet[],
): string[] {
  return toggleSelection(
    pets.map((pet) => pet.id),
    selected,
    petId,
  );
}

/** The route parameter for a selection: undefined when every pet is selected. */
export function toPetSelectionParam(
  selected: readonly string[],
  pets: readonly Pet[],
): string | undefined {
  return selected.length === pets.length ? undefined : selected.join(',');
}
