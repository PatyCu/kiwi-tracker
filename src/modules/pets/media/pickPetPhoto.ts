import * as ImagePicker from 'expo-image-picker';

import { SelectedPetPhoto } from '@/modules/pets/media/preparePetPhotoUpload';

type PetPhotoPickResult =
  | { status: 'selected'; photo: SelectedPetPhoto }
  | { status: 'cancelled' | 'permission-denied' | 'failed' };

export async function pickPetPhoto(): Promise<PetPhotoPickResult> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return { status: 'permission-denied' };

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return { status: 'cancelled' };

    const asset = result.assets[0];
    return {
      status: 'selected',
      photo: { uri: asset.uri, width: asset.width, height: asset.height },
    };
  } catch {
    return { status: 'failed' };
  }
}
