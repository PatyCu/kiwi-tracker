import { Image } from 'react-native';

const brandLogo = require('../assets/images/logo.png');

type BrandLogoProps = {
  size?: number;
};

export function BrandLogo({ size = 52 }: BrandLogoProps) {
  return (
    <Image
      accessibilityLabel="Kiwi Tracker logo"
      accessibilityRole="image"
      resizeMode="contain"
      source={brandLogo}
      style={{ width: size, height: size }}
    />
  );
}
