import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/BrandLogo';
import type { DashboardLoadStatus } from '@/hooks/useDashboardData';
import { Palette } from '@/lib/theme';

type DashboardLoadStateProps = {
  status: Exclude<DashboardLoadStatus, 'ready'>;
  isDark: boolean;
  colors: Palette;
  onRetry: () => void;
};

export function DashboardLoadState({ status, isDark, colors, onRetry }: DashboardLoadStateProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.container}>
        <BrandLogo size={64} />
        {status === 'loading' ? (
          <>
            <ActivityIndicator color={colors.kiwi} size="large" />
            <Text style={styles.title}>Loading your data…</Text>
            <Text style={styles.body}>Your saved pets and health events are being prepared.</Text>
          </>
        ) : (
          <>
            <Ionicons name="cloud-offline-outline" size={34} color={colors.coral} />
            <Text style={styles.title}>Could not load your data</Text>
            <Text style={styles.body}>
              Your saved data has not been changed. Check your device storage and try again.
            </Text>
            <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 16,
    },
    title: { color: colors.text, fontSize: 21, fontWeight: '700', textAlign: 'center' },
    body: {
      maxWidth: 420,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },
    retryButton: {
      minWidth: 140,
      backgroundColor: colors.kiwi,
      borderRadius: 14,
      paddingHorizontal: 22,
      paddingVertical: 14,
      alignItems: 'center',
    },
    retryText: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  });
