import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfile, uploadProfileImage } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export default function EditProfileScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { profile } = route.params;
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [photoURI, setPhotoURI] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentPhoto = photoURI ?? profile?.photoURL;

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'We need access to your photos.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setPhotoURI(result.assets[0].uri);
  }

  async function handleSave() {
    if (!displayName.trim()) { Alert.alert('Name required'); return; }
    setLoading(true);
    try {
      let updates = { displayName: displayName.trim(), username: username.trim(), bio: bio.trim() };
      if (photoURI) {
        const photoURL = await uploadProfileImage(photoURI, user.uid);
        updates.photoURL = photoURL;
      }
      await updateUserProfile(user.uid, updates);
      Alert.alert('Saved!', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save changes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Edit Profile</Text>
        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8}>
            {currentPhoto ? (
              <Image source={{ uri: currentPhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {(displayName || user?.email || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={[styles.cameraOverlay, { backgroundColor: colors.textPrimary, borderColor: colors.background }]}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Display Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
          maxLength={40}
        />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Username</Text>
        <View style={[styles.usernameRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.atSign, { color: colors.textSecondary }]}>@</Text>
          <TextInput
            style={[styles.usernameInput, { color: colors.textPrimary }]}
            value={username}
            onChangeText={t => setUsername(t.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase())}
            placeholder="yourhandle"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            maxLength={30}
          />
        </View>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell people about your style..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={150}
        />
        <Text style={[styles.charCount, { color: colors.textMuted }]}>{bio.length}/150</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md, borderBottomWidth: 1 },
  cancelText: { fontSize: FONT_SIZE.md, fontWeight: '500' },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  scroll: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, alignItems: 'stretch' },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.lg, marginTop: SPACING.sm },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 38, color: COLORS.white, fontWeight: '700' },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  cameraIcon: { fontSize: 14 },
  changePhotoText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600', marginTop: SPACING.sm },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '700', marginTop: SPACING.md, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONT_SIZE.md, marginBottom: SPACING.sm },
  usernameRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BORDER_RADIUS.md, paddingLeft: SPACING.md, marginBottom: SPACING.sm },
  atSign: { fontSize: FONT_SIZE.md, marginRight: 4 },
  usernameInput: { flex: 1, fontSize: FONT_SIZE.md, paddingHorizontal: SPACING.sm, paddingVertical: 12 },
  bioInput: { height: 100, textAlignVertical: 'top' },
  charCount: { fontSize: FONT_SIZE.xs, textAlign: 'right' },
});
