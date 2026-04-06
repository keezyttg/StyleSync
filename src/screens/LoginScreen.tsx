import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { signIn, signUp, resetPassword } from '../services/auth';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

type Tab = 'login' | 'signup';

export default function LoginScreen() {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      if (tab === 'login') {
        await signIn(email.trim(), password);
      } else {
        if (!username) { Alert.alert('Error', 'Username is required.'); return; }
        await signUp(email.trim(), password, username.trim());
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) { Alert.alert('Enter your email first.'); return; }
    try {
      await resetPassword(email.trim());
      Alert.alert('Check your email', 'A password reset link has been sent.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <Text style={styles.logoBlack}>Style</Text>
          <Text style={styles.logoMagenta}>Sync</Text>
        </View>
        <Text style={styles.headline}>Get Started now</Text>
        <Text style={styles.subheadline}>Create an account or log in to explore about our app</Text>

        {/* Tab Toggle */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, tab === 'login' && styles.tabActive]}
            onPress={() => setTab('login')}
          >
            <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'signup' && styles.tabActive]}
            onPress={() => setTab('signup')}
          >
            <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {tab === 'signup' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="@yourhandle"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {tab === 'login' && (
          <View style={styles.rememberRow}>
            <Text style={styles.textSecondary}>Remember me</Text>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryBtnText}>{tab === 'login' ? 'Log In' : 'Create Account'}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.orRow}>
          <View style={styles.divider} />
          <Text style={styles.orText}>Or login with</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialRow}>
          {['G', 'f', '', ''].map((icon, i) => (
            <TouchableOpacity key={i} style={styles.socialBtn}>
              <Text style={styles.socialIcon}>{['🇬', '📘', '🍎', '📱'][i]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scroll: { paddingHorizontal: SPACING.xl, paddingTop: 80, paddingBottom: 40 },
  logoRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: SPACING.sm },
  logoBlack: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary },
  logoMagenta: { fontSize: 32, fontStyle: 'italic', color: COLORS.primary },
  headline: { fontSize: FONT_SIZE.xxl, fontWeight: '800', textAlign: 'center', marginBottom: SPACING.xs },
  subheadline: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: BORDER_RADIUS.sm, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.white, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: COLORS.textPrimary, fontWeight: '700' },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { padding: SPACING.sm, marginLeft: SPACING.xs },
  eyeText: { fontSize: 18 },
  rememberRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
  textSecondary: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  forgotText: { color: COLORS.primary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  primaryBtnText: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  orRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  orText: { marginHorizontal: SPACING.sm, color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.md },
  socialBtn: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: { fontSize: 22 },
});
