export const PET_SPECIES = ['Cat', 'Dog', 'Other'] as const;

export type Pet = {
  id: string;
  name: string;
  species: (typeof PET_SPECIES)[number];
  breed?: string;
  birthDate?: string;
  /** Where the pet's photo is stored in the household's photo bucket. */
  photoPath?: string;
  /** A link that shows the photo, which expires; see petPhotoStore. */
  photoUri?: string;
};

/** What a person enters for a pet; the id and photo come from storage. */
export type PetProfile = Omit<Pet, 'id' | 'photoPath' | 'photoUri'>;
