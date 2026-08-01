import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { Appearance } from '@/shared/theme/Appearance';
import { darkColors, lightColors, Palette } from '@/shared/theme/palette';

type AppearanceContextValue = {
  appearance: Appearance;
  colors: Palette;
  isDark: boolean;
  setAppearance: (appearance: Appearance) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [appearance, setAppearance] = useState<Appearance>('system');
  const isDark = appearance === 'dark' || (appearance === 'system' && scheme === 'dark');
  const value = useMemo(
    () => ({ appearance, colors: isDark ? darkColors : lightColors, isDark, setAppearance }),
    [appearance, isDark],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used inside AppearanceProvider.');
  return value;
}
