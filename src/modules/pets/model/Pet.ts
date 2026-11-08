export const PET_SPECIES = ['Cat', 'Dog', 'Other'] as const;

export type Pet = {
  id: string;
  name: string;
  species: (typeof PET_SPECIES)[number];
  breed?: string;
  birthDate?: string;
  photoUri?: string;
};

/** What a person enters for a pet; the id comes from storage. */
export type PetProfile = Omit<Pet, 'id' | 'photoUri'>;
