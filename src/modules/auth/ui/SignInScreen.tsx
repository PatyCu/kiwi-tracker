import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePasswordSignInForm } from '@/modules/auth/forms/usePasswordSignInForm';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { AppIdentity } from '@/shared/ui/AppIdentity';

export function SignInScreen() {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const form = usePasswordSignInForm();
  const passwordInput = useRef<TextInput>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* "handled" lets the first tap on a button work while the keyboard is open. */}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <AppIdentity />
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.body}>Sign in with the account you were given.</Text>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            accessibilityLabel="Email"
            value={form.email}
            onChangeText={form.setEmail}
            onSubmitEditing={() => passwordInput.current?.focus()}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            autoFocus
            editable={!form.signingIn}
            inputMode="email"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            returnKeyType="next"
            submitBehavior="submit"
            textContentType="username"
            style={styles.input}
          />
          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.passwordField}>
            <TextInput
              ref={passwordInput}
              accessibilityLabel="Password"
              value={form.password}
              onChangeText={form.setPassword}
              onSubmitEditing={() => void form.submit()}
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect={false}
              editable={!form.signingIn}
              returnKeyType="go"
              secureTextEntry={!passwordVisible}
              textContentType="password"
              style={styles.passwordInput}
            />
            {/* The icon shows the current state: an open, tinted eye while the password is visible. */}
            <Pressable
              accessibilityLabel="Show password"
              accessibilityRole="switch"
              accessibilityState={{ checked: passwordVisible }}
              hitSlop={8}
              onPress={() => setPasswordVisible((visible) => !visible)}
              style={styles.passwordToggle}
            >
              <Ionicons
                name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={passwordVisible ? colors.kiwi : colors.muted}
              />
            </Pressable>
          </View>
          {form.error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {form.error}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: form.signingIn }}
            disabled={form.signingIn}
            onPress={() => void form.submit()}
            style={[styles.primaryButton, form.signingIn && styles.disabled]}
          >
            <Text style={styles.primaryText}>{form.signingIn ? 'Signing in…' : 'Sign in'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    content: { width: '100%', maxWidth: 420, alignSelf: 'center' },
    title: { color: colors.text, fontSize: 31, fontWeight: '800', marginTop: 32 },
    body: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: 8 },
    label: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.3,
      marginTop: 24,
      marginBottom: 10,
    },
    input: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      minHeight: 50,
      padding: 14,
      color: colors.text,
      fontSize: 16,
    },
    passwordField: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      minHeight: 50,
    },
    passwordInput: { flex: 1, padding: 14, color: colors.text, fontSize: 16 },
    passwordToggle: { paddingHorizontal: 14, alignSelf: 'stretch', justifyContent: 'center' },
    error: { color: colors.coral, fontSize: 14, lineHeight: 20, marginTop: 12 },
    primaryButton: {
      backgroundColor: colors.kiwi,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      marginTop: 18,
    },
    primaryText: { color: colors.ink, fontWeight: '800', fontSize: 15 },
    disabled: { opacity: 0.5 },
  });
