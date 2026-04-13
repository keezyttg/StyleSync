import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfile, uploadProfileImage } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export default function EditProfileScreen({ navigation, route }) {
  const { user } = useAuth();
  const { profile } = route.params;
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [photoURI, setPhotoURI] = useState(null); // local URI if changed
  const [loading, setLoading] = useState(false);

  const currentPhoto = photoURI ?? profile?.photoURL;

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPhotoURI(result.assets[0].uri);
  }

  async function handleSave() {
    if (!displayName.trim()) { Alert.alert('Name required'); return; }
    setLoading(true);
    try {
      let updates = {
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
      };
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Avatar picker */}
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
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor={COLORS.textMuted}
          maxLength={40}
        />

        <Text style={styles.label}>Username</Text>
        <View style={styles.usernameRow}>
          <Text style={styles.atSign}>@</Text>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={username}
            onChangeText={t => setUsername(t.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase())}
            placeholder="yourhandle"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            maxLength={30}
          />
        </View>

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell people about your style..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={150}
        />
        <Text style={styles.charCount}>{bio.length}/150</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md, borderBottomWidth: 1, borderColor: COLORS.border },
  cancelText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  scroll: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, alignItems: 'stretch' },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.lg, marginTop: SPACING.sm },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 38, color: COLORS.white, fontWeight: '700' },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.textPrimary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white },
  cameraIcon: { fontSize: 14 },
  changePhotoText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600', marginTop: SPACING.sm },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONT_SIZE.md, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  usernameRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingLeft: SPACING.md, marginBottom: SPACING.sm },
  atSign: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginRight: 4 },
  bioInput: { height: 100, textAlignVertical: 'top' },
  charCount: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: 'right' },
});
