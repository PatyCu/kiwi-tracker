import { HealthEvent, loadHealthEvents } from '@/lib/healthEvents';
import { deletePersistedPetPhoto, migrateLegacyPetPhotos } from '@/lib/petImages';
import { loadPets, Pet, PetState, savePets } from '@/lib/pets';

export type DashboardData = {
  healthEvents: HealthEvent[];
  petState: PetState;
  photoMigrationWarningPetNames: string[];
};

export async function loadDashboardData(): Promise<DashboardData> {
  const [healthEvents, petState] = await Promise.all([loadHealthEvents(), loadPets()]);
  const migration = await migrateLegacyPetPhotos(petState.pets);
  let resolvedPetState = petState;

  if (migration.didChange) {
    try {
      await savePets(migration.pets, petState.activePetId);
      resolvedPetState = { pets: migration.pets, activePetId: petState.activePetId };
    } catch {
      try {
        resolvedPetState = await loadPets();
        const referencedPhotoUris = new Set(
          resolvedPetState.pets.map((pet) => pet.photoUri).filter(Boolean),
        );
        await Promise.all(
          migration.createdUris
            .filter((uri) => !referencedPhotoUris.has(uri))
            .map((uri) => deletePersistedPetPhoto(uri).catch(() => undefined)),
        );
      } catch {
        resolvedPetState = petState;
      }
      migration.failedPetNames = findFailedPhotoMigrationPetNames(
        petState.pets,
        resolvedPetState.pets,
      );
    }
  }

  return {
    healthEvents,
    petState: resolvedPetState,
    photoMigrationWarningPetNames: migration.failedPetNames,
  };
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
