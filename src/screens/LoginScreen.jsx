import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signIn, signUp, resetPassword, useGoogleSignIn } from '../services/auth';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { ONBOARDING_KEY } from './OnboardingScreen';

export default function LoginScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { request, promptAsync, googleError } = useGoogleSignIn();

  useEffect(() => {
    if (googleError) Alert.alert('Google Sign-In Failed', googleError);
  }, [googleError]);

  async function handleSubmit() {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields.'); return; }
    setLoading(true);
    try {
      if (tab === 'login') {
        await signIn(email.trim(), password);
      } else {
        if (!username) { Alert.alert('Error', 'Username is required.'); return; }
        await AsyncStorage.removeItem(ONBOARDING_KEY);
        await signUp(email.trim(), password, username.trim());
      }
    } catch (err) {
      const msg = {
        'auth/user-not-found': 'No account found with that email.',
        'auth/wrong-password': 'Incorrect password. Try again.',
        'auth/invalid-credential': 'Email or password is incorrect.',
        'auth/email-already-in-use': 'An account with that email already exists.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/network-request-failed': 'No internet connection. Check your network.',
        'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
      }[err.code] || 'Something went wrong. Please try again.';
      Alert.alert(tab === 'login' ? 'Log In Failed' : 'Sign Up Failed', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) { Alert.alert('Enter your email first.'); return; }
    try {
      await resetPassword(email.trim());
      Alert.alert('Check your email', 'A password reset link has been sent.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <Text style={[styles.logoBlack, { color: colors.textPrimary }]}>Style</Text>
          <Text style={styles.logoMagenta}>Sync</Text>
        </View>
        <Text style={[styles.headline, { color: colors.textPrimary }]}>Get Started now</Text>
        <Text style={[styles.subheadline, { color: colors.textSecondary }]}>Create an account or log in to explore about our app</Text>

        <View style={[styles.tabRow, { backgroundColor: colors.surface }]}>
          {['login', 'signup'].map(t => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && [styles.tabActive, { backgroundColor: colors.card }]]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, { color: colors.textSecondary }, tab === t && { color: colors.textPrimary, fontWeight: '700' }]}>
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'signup' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]} placeholder="@yourhandle" placeholderTextColor={colors.textMuted} value={username} onChangeText={setUsername} autoCapitalize="none" />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]} placeholder="you@email.com" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
          <View style={[styles.passwordRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput style={[styles.passwordInput, { color: colors.textPrimary }]} placeholder="••••••••" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {tab === 'login' && (
          <View style={styles.rememberRow}>
            <Text style={[styles.textSecondary, { color: colors.textSecondary }]}>Remember me</Text>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : (
            <Text style={styles.primaryBtnText}>{tab === 'login' ? 'Log In' : 'Create Account'}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.orRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.orText, { color: colors.textSecondary }]}>Or login with</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[styles.socialBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            disabled={!request}
            onPress={() => promptAsync()}
          >
            <Text style={styles.socialIcon}>🇬</Text>
          </TouchableOpacity>
          {['📘', '🍎', '📱'].map((icon, i) => (
            <TouchableOpacity key={i} style={[styles.socialBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={styles.socialIcon}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: SPACING.xl, paddingTop: 80, paddingBottom: 40 },
  logoRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: SPACING.sm },
  logoBlack: { fontSize: 32, fontWeight: '900' },
  logoMagenta: { fontSize: 32, fontStyle: 'italic', color: COLORS.primary },
  headline: { fontSize: FONT_SIZE.xxl, fontWeight: '800', textAlign: 'center', marginBottom: SPACING.xs },
  subheadline: { fontSize: FONT_SIZE.sm, textAlign: 'center', marginBottom: SPACING.xl },
  tabRow: { flexDirection: 'row', borderRadius: BORDER_RADIUS.md, padding: 4, marginBottom: SPACING.lg },
  tab: { flex: 1, paddingVertical: 10, borderRadius: BORDER_RADIUS.sm, alignItems: 'center' },
  tabActive: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: FONT_SIZE.md, fontWeight: '500' },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZE.sm, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONT_SIZE.md },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BORDER_RADIUS.md },
  passwordInput: { flex: 1, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONT_SIZE.md },
  eyeBtn: { padding: SPACING.sm, marginLeft: SPACING.xs },
  eyeText: { fontSize: 18 },
  rememberRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
  textSecondary: { fontSize: FONT_SIZE.sm },
  forgotText: { color: COLORS.primary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: 16, alignItems: 'center', marginBottom: SPACING.lg },
  primaryBtnText: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  orRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  divider: { flex: 1, height: 1 },
  orText: { marginHorizontal: SPACING.sm, fontSize: FONT_SIZE.sm },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.md },
  socialBtn: { width: 56, height: 56, borderWidth: 1, borderRadius: BORDER_RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  socialIcon: { fontSize: 22 },
});
