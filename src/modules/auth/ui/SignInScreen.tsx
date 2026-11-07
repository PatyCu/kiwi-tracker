import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useEmailCodeSignInForm } from '@/modules/auth/forms/useEmailCodeSignInForm';
import { EMAIL_CODE_LENGTH } from '@/modules/auth/model/emailCode';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { AppIdentity } from '@/shared/ui/AppIdentity';

export function SignInScreen() {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const form = useEmailCodeSignInForm();
  const busy = form.pending !== null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* "handled" lets the first tap on a button work while the keyboard is open. */}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <AppIdentity />
          {form.step === 'email' ? (
            <>
              <Text style={styles.title}>Sign in</Text>
              <Text style={styles.body}>
                Enter your email and we&apos;ll send you a {EMAIL_CODE_LENGTH}-digit code. New here?
                The same code creates your account.
              </Text>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                accessibilityLabel="Email"
                value={form.email}
                onChangeText={form.setEmail}
                onSubmitEditing={() => void form.submitEmail()}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                autoFocus
                editable={!busy}
                inputMode="email"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                returnKeyType="send"
                textContentType="emailAddress"
                style={styles.input}
              />
              <FormMessages error={form.error} notice={form.notice} styles={styles} />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                onPress={() => void form.submitEmail()}
                style={[styles.primaryButton, busy && styles.disabled]}
              >
                <Text style={styles.primaryText}>
                  {form.pending === 'sending' ? 'Sending…' : 'Send code'}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.body}>
                Enter the {EMAIL_CODE_LENGTH}-digit code we sent to{' '}
                <Text style={styles.email}>{form.email}</Text>.
              </Text>
              <Text style={styles.label}>CODE</Text>
              <TextInput
                accessibilityLabel="Sign-in code"
                value={form.code}
                onChangeText={form.setCode}
                onSubmitEditing={() => void form.submitCode()}
                autoComplete="one-time-code"
                autoFocus
                editable={!busy}
                inputMode="numeric"
                keyboardType="number-pad"
                maxLength={EMAIL_CODE_LENGTH}
                placeholder={'0'.repeat(EMAIL_CODE_LENGTH)}
                placeholderTextColor={colors.muted}
                returnKeyType="done"
                textContentType="oneTimeCode"
                style={[styles.input, styles.codeInput]}
              />
              <FormMessages error={form.error} notice={form.notice} styles={styles} />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                onPress={() => void form.submitCode()}
                style={[styles.primaryButton, busy && styles.disabled]}
              >
                <Text style={styles.primaryText}>
                  {form.pending === 'verifying' ? 'Signing in…' : 'Sign in'}
                </Text>
              </Pressable>
              <View style={styles.secondaryRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: busy }}
                  disabled={busy}
                  onPress={() => void form.resendCode()}
                  style={styles.secondaryButton}
                >
                  <Text style={[styles.secondaryText, busy && styles.disabled]}>
                    {form.pending === 'resending' ? 'Sending…' : 'Send a new code'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: busy }}
                  disabled={busy}
                  onPress={form.changeEmail}
                  style={styles.secondaryButton}
                >
                  <Text style={[styles.secondaryText, busy && styles.disabled]}>
                    Use a different email
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type FormMessagesProps = {
  error: string | null;
  notice: string | null;
  styles: ReturnType<typeof makeStyles>;
};

function FormMessages({ error, notice, styles }: FormMessagesProps) {
  if (error) {
    return (
      <Text accessibilityRole="alert" style={styles.error}>
        {error}
      </Text>
    );
  }
  if (notice) return <Text style={styles.notice}>{notice}</Text>;
  return null;
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    content: { width: '100%', maxWidth: 420, alignSelf: 'center' },
    title: { color: colors.text, fontSize: 31, fontWeight: '800', marginTop: 32 },
    body: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: 8 },
    email: { color: colors.text, fontWeight: '700' },
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
    codeInput: { fontSize: 24, fontWeight: '700', letterSpacing: 8, textAlign: 'center' },
    error: { color: colors.coral, fontSize: 14, lineHeight: 20, marginTop: 12 },
    notice: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 12 },
    primaryButton: {
      backgroundColor: colors.kiwi,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      marginTop: 18,
    },
    primaryText: { color: colors.ink, fontWeight: '800', fontSize: 15 },
    disabled: { opacity: 0.5 },
    secondaryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    secondaryButton: { paddingVertical: 14 },
    secondaryText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  });
