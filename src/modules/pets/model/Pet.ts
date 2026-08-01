export type Pet = {
  id: string;
  name: string;
  species: 'Cat' | 'Dog' | 'Other';
  breed?: string;
  birthDate?: string;
  photoUri?: string;
  photoStorageVersion?: 1;
  createdAt: string;
};

export type PetState = {
  pets: Pet[];
  activePetId: string;
};

export const DEFAULT_PET: Pet = {
  id: 'kiwi',
  name: 'Kiwi',
  species: 'Cat',
  createdAt: '2025-01-01T00:00:00.000Z',
};
