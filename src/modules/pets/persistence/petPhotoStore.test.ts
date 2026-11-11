import {
  PET_PHOTO_LINK_LIFETIME_SECONDS,
  PetPhotoStorageError,
  removePetPhoto,
  uploadPetPhoto,
  withPhotoLinks,
} from '@/modules/pets/persistence/petPhotoStore';
import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

jest.mock('@/shared/supabase/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));

function mockBucket(bucket: {
  upload?: jest.Mock;
  remove?: jest.Mock;
  createSignedUrls?: jest.Mock;
}) {
  const from = jest.fn(() => bucket);
  jest
    .mocked(getSupabaseClient)
    .mockReturnValue({ storage: { from } } as unknown as ReturnType<typeof getSupabaseClient>);
  return from;
}

const kiwi = { id: 'kiwi-id', name: 'Kiwi', species: 'Cat' as const, photoPath: 'kiwi-id/1.jpg' };
const biscuit = { id: 'biscuit-id', name: 'Biscuit', species: 'Dog' as const };

describe('pet photo storage', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("stores each new photo under its own name in the pet's folder", async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_762_621_200_000);
    const upload = jest.fn().mockResolvedValue({ data: {}, error: null });
    const from = mockBucket({ upload });
    const bytes = new ArrayBuffer(4);

    await expect(uploadPetPhoto('kiwi-id', { bytes, contentType: 'image/jpeg' })).resolves.toBe(
      'kiwi-id/1762621200000.jpg',
    );
    expect(from).toHaveBeenCalledWith('pet-photos');
    expect(upload).toHaveBeenCalledWith('kiwi-id/1762621200000.jpg', bytes, {
      contentType: 'image/jpeg',
    });
  });

  it('deletes one photo file by path', async () => {
    const remove = jest.fn().mockResolvedValue({ data: [], error: null });
    mockBucket({ remove });

    await removePetPhoto('kiwi-id/old.jpg');

    expect(remove).toHaveBeenCalledWith(['kiwi-id/old.jpg']);
  });

  it('wraps a failed delete in a typed error', async () => {
    mockBucket({ remove: jest.fn().mockResolvedValue({ data: null, error: { message: 'x' } }) });

    await expect(removePetPhoto('kiwi-id/old.jpg')).rejects.toMatchObject<
      Partial<PetPhotoStorageError>
    >({ code: 'REMOVE_FAILED' });
  });

  it('wraps a refused upload in a typed error', async () => {
    mockBucket({ upload: jest.fn().mockResolvedValue({ data: null, error: { message: 'rls' } }) });

    await expect(
      uploadPetPhoto('other-pet', { bytes: new ArrayBuffer(1), contentType: 'image/jpeg' }),
    ).rejects.toMatchObject<Partial<PetPhotoStorageError>>({ code: 'UPLOAD_FAILED' });
  });

  it('signs a link for each stored photo in one request', async () => {
    const createSignedUrls = jest.fn().mockResolvedValue({
      data: [{ path: 'kiwi-id/1.jpg', signedUrl: 'https://storage.test/kiwi', error: null }],
      error: null,
    });
    mockBucket({ createSignedUrls });

    await expect(withPhotoLinks([kiwi, biscuit])).resolves.toEqual([
      { ...kiwi, photoUri: 'https://storage.test/kiwi' },
      biscuit,
    ]);
    expect(createSignedUrls).toHaveBeenCalledWith(
      ['kiwi-id/1.jpg'],
      PET_PHOTO_LINK_LIFETIME_SECONDS,
    );
  });

  it('leaves a photo it cannot sign without a link', async () => {
    mockBucket({
      createSignedUrls: jest.fn().mockResolvedValue({
        data: [{ path: 'kiwi-id/1.jpg', signedUrl: '', error: 'Object not found' }],
        error: null,
      }),
    });

    await expect(withPhotoLinks([{ ...kiwi, photoUri: 'https://old' }])).resolves.toEqual([kiwi]);
  });

  it('makes no request when no pet has a photo', async () => {
    const createSignedUrls = jest.fn();
    mockBucket({ createSignedUrls });

    await expect(withPhotoLinks([biscuit])).resolves.toEqual([biscuit]);
    expect(createSignedUrls).not.toHaveBeenCalled();
  });

  it('wraps a failed signing request in a typed error', async () => {
    mockBucket({
      createSignedUrls: jest.fn().mockResolvedValue({ data: null, error: { message: 'offline' } }),
    });

    await expect(withPhotoLinks([kiwi])).rejects.toMatchObject<Partial<PetPhotoStorageError>>({
      code: 'LINK_FAILED',
    });
  });
});
