import { formatPetNames } from '@/modules/today/formatPetNames';

describe('formatPetNames', () => {
  it.each([
    [['Murri'], 'Murri'],
    [['Murri', 'Kiwi'], 'Murri and Kiwi'],
    [['Murri', 'Kiwi', 'Muffin'], 'Murri, Kiwi and Muffin'],
    [['Murri', 'Kiwi', 'Muffin', 'Cupcake'], 'Murri, Kiwi, Muffin and Cupcake'],
  ])('formats %j as a readable list', (names, expected) => {
    expect(formatPetNames(names)).toBe(expected);
  });
});
