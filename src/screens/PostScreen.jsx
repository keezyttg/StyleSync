import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadOutfitImage, createOutfit } from '../services/outfits';
import { getCustomTags, saveCustomTags, getClosetItems } from '../services/closet';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const STYLE_TAGS = ['Streetwear', 'Fall', 'Casual', 'Formal', 'Minimalist', 'Vintage', 'Business Casual', 'Athleisure'];

export default function PostScreen({ navigation, route }) {
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState(route.params?.imageUri ?? null);
  const preselectedItems = route.params?.preselectedItems ?? [];
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [customTags, setCustomTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [closetItems, setClosetItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    if (user) {
      getCustomTags(user.uid).then(setCustomTags);
      getClosetItems(user.uid).then(setClosetItems).catch(() => {});
    }
  }, [user?.uid]);

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

  function handleAddCustomTag() {
    const tag = newTagInput.trim();
    if (!tag) return;
    if ([...STYLE_TAGS, ...customTags].includes(tag)) {
      toggleTag(tag);
      setNewTagInput('');
      setShowTagInput(false);
      return;
    }
    const updated = [...customTags, tag];
    setCustomTags(updated);
    saveCustomTags(user.uid, updated);
    setSelectedTags(prev => [...new Set([...prev, tag])]);
    setNewTagInput('');
    setShowTagInput(false);
  }

  async function handlePost() {
    if (!imageUri || !user) { Alert.alert('Add a photo first'); return; }
    if (loading) return;
    setLoading(true);
    setUploadError(null);
    try {
      const imageURL = await uploadOutfitImage(imageUri, user.uid);
      const items = selectedItems.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        imageURL: i.imageURL,
        brand: i.brand ?? '',
        price: i.price ?? 0,
        currency: i.currency ?? '$',
      }));
      await createOutfit({
        userId: user.uid,
        username: user.displayName ?? '',
        userPhotoURL: user.photoURL ?? null,
        imageURL,
        caption,
        tags: selectedTags,
        itemIds: items.map(i => i.id),
        items,
      });
      // Navigate first — don't reset state, the screen unmounts naturally.
      // Navigate to Main with Feed tab active, which dismisses Camera + Post modals.
      navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Feed' } }] });
    } catch (err) {
      setUploadError('Upload failed. Check your connection and try again.');
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
            <TouchableOpacity
              style={[styles.postBtn, loading && styles.postBtnDisabled]}
              onPress={handlePost}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={loading ? 'Posting' : 'Post'}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.postBtnText}>Post</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.form}>
            {uploadError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{uploadError}</Text>
                <TouchableOpacity onPress={handlePost} style={styles.retryInlineBtn}>
                  <Text style={styles.retryInlineText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            <TextInput style={styles.captionInput} placeholder="Add a Caption..." placeholderTextColor={COLORS.textMuted} value={caption} onChangeText={setCaption} multiline maxLength={150} />
            <Text style={styles.charCount}>{caption.length}/150</Text>

            {closetItems.length > 0 && (
              <View style={{ marginBottom: SPACING.lg }}>
                <Text style={styles.sectionLabel}>Pieces in this outfit</Text>
                <FlatList
                  data={closetItems}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={item => item.id}
                  contentContainerStyle={{ gap: SPACING.sm }}
                  renderItem={({ item }) => {
                    const isSelected = selectedItems.some(s => s.id === item.id);
                    return (
                      <TouchableOpacity
                        onPress={() => setSelectedItems(prev =>
                          isSelected ? prev.filter(s => s.id !== item.id) : [...prev, item]
                        )}
                        style={styles.itemThumb}
                        activeOpacity={0.7}
                      >
                        <Image source={{ uri: item.imageURL }} style={[styles.itemThumbImg, isSelected && styles.itemThumbImgSelected]} resizeMode="cover" />
                        {isSelected && <View style={styles.itemThumbCheck}><Text style={styles.itemThumbCheckText}>✓</Text></View>}
                        <Text style={styles.itemThumbName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.itemThumbCat}>{item.category}</Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            <Text style={styles.sectionLabel}>Style Tags</Text>
            <View style={styles.tagsRow}>
              {[...STYLE_TAGS, ...customTags].map(tag => (
                <TouchableOpacity key={tag} style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipActive]} onPress={() => toggleTag(tag)}>
                  <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>{tag}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.tagChip, styles.addTagChip]} onPress={() => setShowTagInput(true)}>
                <Text style={[styles.tagText, { color: COLORS.textSecondary }]}>+ Create</Text>
              </TouchableOpacity>
            </View>
            {showTagInput && (
              <View style={styles.tagInputRow}>
                <TextInput
                  style={styles.tagInputField}
                  placeholder="New tag name…"
                  placeholderTextColor={COLORS.textMuted}
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  onSubmitEditing={handleAddCustomTag}
                  autoFocus
                  maxLength={30}
                />
                <TouchableOpacity onPress={handleAddCustomTag} style={styles.tagInputConfirm}>
                  <Text style={styles.tagInputConfirmText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowTagInput(false); setNewTagInput(''); }} style={styles.tagInputCancel}>
                  <Text style={styles.tagInputCancelText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        <View style={styles.pickContainer}>
          <Text style={styles.pickTitle}>Share your outfit</Text>
          <Text style={styles.pickSubtitle}>Capture or upload a photo to post</Text>
          <TouchableOpacity style={styles.cameraBtn} onPress={() => navigation.navigate('Camera')}>
            <Text style={styles.cameraBtnIcon}>📷</Text>
            <Text style={styles.cameraBtnText}>Open Camera</Text>
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
  pickSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: -SPACING.sm },
  cameraBtn: { width: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 56, alignItems: 'center', gap: SPACING.sm },
  cameraBtnIcon: { fontSize: 40 },
  cameraBtnText: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  galleryBtn: { width: '100%', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingVertical: 16, alignItems: 'center' },
  galleryBtnText: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textPrimary },
  errorBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF0F0', borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#FFCCCC' },
  errorBannerText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.error, lineHeight: 18 },
  retryInlineBtn: { marginLeft: SPACING.sm, paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.error },
  retryInlineText: { fontSize: FONT_SIZE.sm, color: COLORS.error, fontWeight: '700' },
  itemThumb: { width: 80, position: 'relative' },
  itemThumbSelected: { opacity: 1 },
  itemThumbImg: { width: 80, height: 80, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: 'transparent' },
  itemThumbImgSelected: { borderColor: COLORS.primary },
  itemThumbCheck: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  itemThumbCheckText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  itemThumbName: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.textPrimary, marginTop: 4 },
  itemThumbCat: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  addTagChip: { borderStyle: 'dashed' },
  tagInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm, marginBottom: SPACING.md, height: 44 },
  tagInputField: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, paddingVertical: 0 },
  tagInputConfirm: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: BORDER_RADIUS.sm, marginLeft: SPACING.sm },
  tagInputConfirmText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  tagInputCancel: { paddingHorizontal: SPACING.sm, paddingVertical: 6 },
  tagInputCancelText: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textSecondary },
});
