// expo-image can't load under jest-expo: its startup check calls a native
// module that jest-expo only stubs. Tests render React Native's Image instead.
import { ComponentProps } from 'react';
import { Image as NativeImage } from 'react-native';

type ImageProps = Omit<ComponentProps<typeof NativeImage>, 'source'> & {
  source?: { uri?: string; cacheKey?: string } | null;
  contentFit?: string;
};

export function Image({ source, contentFit: _contentFit, ...props }: ImageProps) {
  return <NativeImage source={source ? { uri: source.uri } : undefined} {...props} />;
}

Image.clearDiskCache = jest.fn(async () => true);
Image.clearMemoryCache = jest.fn(async () => true);
