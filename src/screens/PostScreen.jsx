import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadOutfitImage, createOutfit } from '../services/outfits';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const STYLE_TAGS = ['Streetwear', 'Fall', 'Casual', 'Formal', 'Minimalist', 'Vintage', 'Business Casual', 'Athleisure'];

export default function PostScreen({ navigation, route }) {
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState(null);
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'We need access to your photos.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'We need camera access.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  function toggleTag(tag) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  async function handlePost() {
    if (!imageUri || !user) { Alert.alert('Add a photo first'); return; }
    setLoading(true);
    try {
      const imageURL = await uploadOutfitImage(imageUri, user.uid);
      await createOutfit({ userId: user.uid, imageURL, caption, tags: selectedTags, itemIds: [] });
      setImageUri(null);
      setCaption('');
      setSelectedTags([]);
      navigation.navigate('Feed');
      Alert.alert('Posted!', 'Your outfit is live.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {imageUri ? (
        <>
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity style={styles.retakeBtn} onPress={() => setImageUri(null)}>
              <Text style={styles.retakeBtnText}>← Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.postBtn, loading && styles.postBtnDisabled]} onPress={handlePost} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.postBtnText}>Post</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.form}>
            <TextInput style={styles.captionInput} placeholder="Add a Caption..." value={caption} onChangeText={setCaption} multiline maxLength={150} />
            <Text style={styles.charCount}>{caption.length}/150</Text>
            <Text style={styles.sectionLabel}>Style Tags</Text>
            <View style={styles.tagsRow}>
              {STYLE_TAGS.map(tag => (
                <TouchableOpacity key={tag} style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipActive]} onPress={() => toggleTag(tag)}>
                  <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </>
      ) : (
        <View style={styles.pickContainer}>
          <Text style={styles.pickTitle}>Share your outfit</Text>
          <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
            <Text style={styles.cameraBtnIcon}>📷</Text>
            <Text style={styles.cameraBtnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
            <Text style={styles.galleryBtnText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  imageContainer: { height: 380, position: 'relative' },
  preview: { width: '100%', height: '100%' },
  retakeBtn: { position: 'absolute', top: 56, left: SPACING.md, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  retakeBtnText: { fontWeight: '700', color: COLORS.textPrimary, fontSize: FONT_SIZE.sm },
  postBtn: { position: 'absolute', top: 56, right: SPACING.md, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  postBtnDisabled: { opacity: 0.6 },
  postBtnText: { fontWeight: '700', color: COLORS.white, fontSize: FONT_SIZE.sm },
  form: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  captionInput: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, paddingBottom: SPACING.xs, borderBottomWidth: 1, borderColor: COLORS.border },
  charCount: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: 'right', marginBottom: SPACING.md },
  sectionLabel: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  tagChip: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  tagChipActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  tagText: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: '500' },
  tagTextActive: { color: COLORS.white, fontWeight: '700' },
  pickContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl, gap: SPACING.lg },
  pickTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.textPrimary },
  cameraBtn: { width: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 56, alignItems: 'center', gap: SPACING.sm },
  cameraBtnIcon: { fontSize: 40 },
  cameraBtnText: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  galleryBtn: { width: '100%', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingVertical: 16, alignItems: 'center' },
  galleryBtnText: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textPrimary },
});
