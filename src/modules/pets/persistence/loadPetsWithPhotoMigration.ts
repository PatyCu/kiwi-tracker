import {
  deletePersistedPetPhoto,
  migrateLegacyPetPhotos,
} from '@/modules/pets/media/petImageStore';
import { Pet, PetState } from '@/modules/pets/model/Pet';
import { loadPets, savePets } from '@/modules/pets/persistence/petStore';

export type LoadedPets = {
  petState: PetState;
  photoMigrationWarningPetNames: string[];
};

export async function loadPetsWithPhotoMigration(): Promise<LoadedPets> {
  const petState = await loadPets();
  const migration = await migrateLegacyPetPhotos(petState.pets);
  let resolvedPetState = petState;

  if (migration.didChange) {
    try {
      await savePets(migration.pets, petState.activePetId);
      resolvedPetState = { pets: migration.pets, activePetId: petState.activePetId };
    } catch {
      resolvedPetState = await recoverPetStateAfterFailedMigration(petState, migration.createdUris);
      migration.failedPetNames = findFailedPhotoMigrationPetNames(
        petState.pets,
        resolvedPetState.pets,
      );
    }
  }

  return {
    petState: resolvedPetState,
    photoMigrationWarningPetNames: migration.failedPetNames,
  };
}

async function recoverPetStateAfterFailedMigration(
  fallbackState: PetState,
  createdUris: string[],
): Promise<PetState> {
  try {
    const persistedState = await loadPets();
    const referencedPhotoUris = new Set(
      persistedState.pets.map((pet) => pet.photoUri).filter(Boolean),
    );
    await Promise.all(
      createdUris
        .filter((uri) => !referencedPhotoUris.has(uri))
        .map((uri) => deletePersistedPetPhoto(uri).catch(() => undefined)),
    );
    return persistedState;
  } catch {
    return fallbackState;
  }
}

function findFailedPhotoMigrationPetNames(originalPets: Pet[], resolvedPets: Pet[]): string[] {
  return originalPets
    .filter((pet) => {
      if (!pet.photoUri) return false;
      const resolvedPet = resolvedPets.find((item) => item.id === pet.id);
      return (
        !resolvedPet ||
        (resolvedPet.photoUri === pet.photoUri && resolvedPet.photoStorageVersion !== 1)
      );
    })
    .map((pet) => pet.name);
}
