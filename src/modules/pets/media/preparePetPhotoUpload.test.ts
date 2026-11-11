import { ImageManipulator } from 'expo-image-manipulator';

import { preparePetPhotoUpload } from '@/modules/pets/media/preparePetPhotoUpload';

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));

function mockManipulation(saved: { uri: string; base64?: string }) {
  const saveAsync = jest.fn().mockResolvedValue({ width: 512, height: 512, ...saved });
  const context = {
    resize: jest.fn(),
    renderAsync: jest.fn().mockResolvedValue({ saveAsync }),
  };
  jest.mocked(ImageManipulator.manipulate).mockReturnValue(context as never);
  return { context, saveAsync };
}

describe('pet photo upload preparation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('scales a photo down to 512px on its longest side and stores it as JPEG', async () => {
    const { context, saveAsync } = mockManipulation({
      uri: 'file:///cache/scaled.jpg',
      base64: btoa('kiwi'),
    });

    const prepared = await preparePetPhotoUpload({
      uri: 'file:///photo.heic',
      width: 3000,
      height: 4000,
    });

    expect(ImageManipulator.manipulate).toHaveBeenCalledWith('file:///photo.heic');
    expect(context.resize).toHaveBeenCalledWith({ height: 512 });
    expect(saveAsync).toHaveBeenCalledWith({ format: 'jpeg', compress: 0.72, base64: true });
    expect(prepared.previewUri).toBe('file:///cache/scaled.jpg');
    expect(prepared.upload.contentType).toBe('image/jpeg');
    expect(Array.from(new Uint8Array(prepared.upload.bytes))).toEqual([107, 105, 119, 105]);
  });

  it('keeps a small photo at its size', async () => {
    const { context } = mockManipulation({ uri: 'file:///small.jpg', base64: btoa('x') });

    await preparePetPhotoUpload({ uri: 'file:///small.png', width: 300, height: 200 });

    expect(context.resize).not.toHaveBeenCalled();
  });

  it('reports a photo it cannot read', async () => {
    jest.mocked(ImageManipulator.manipulate).mockImplementation(() => {
      throw new Error('unsupported');
    });

    await expect(
      preparePetPhotoUpload({ uri: 'file:///broken', width: 10, height: 10 }),
    ).rejects.toThrow('Could not prepare the selected photo.');
  });
});
