import {
  readPetSelection,
  togglePetSelection,
  toPetSelectionParam,
} from '@/modules/calendar/petSelection';
import { Pet } from '@/modules/pets/model/Pet';

const pets: Pet[] = [
  { id: 'kiwi', name: 'Kiwi', species: 'Cat' },
  { id: 'luna', name: 'Luna', species: 'Dog' },
  { id: 'miso', name: 'Miso', species: 'Dog' },
];

describe('calendar pet selection', () => {
  it('selects every pet without a parameter, or when none of its pets exist', () => {
    expect(readPetSelection(undefined, pets)).toEqual(['kiwi', 'luna', 'miso']);
    expect(readPetSelection('gone', pets)).toEqual(['kiwi', 'luna', 'miso']);
  });

  it('reads the pets in the parameter in household order, ignoring unknown ones', () => {
    expect(readPetSelection('miso,gone,kiwi', pets)).toEqual(['kiwi', 'miso']);
  });

  it('turns pets on and off but keeps the last one on', () => {
    expect(togglePetSelection(['kiwi', 'luna', 'miso'], 'luna', pets)).toEqual(['kiwi', 'miso']);
    expect(togglePetSelection(['kiwi', 'miso'], 'luna', pets)).toEqual(['kiwi', 'luna', 'miso']);
    expect(togglePetSelection(['luna'], 'luna', pets)).toEqual(['luna']);
  });

  it('leaves the parameter out when every pet is selected', () => {
    expect(toPetSelectionParam(['kiwi', 'luna', 'miso'], pets)).toBeUndefined();
    expect(toPetSelectionParam(['kiwi', 'miso'], pets)).toBe('kiwi,miso');
  });
});
