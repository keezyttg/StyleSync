import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadItemImage, updateClothingItem, getCustomTags, saveCustomTags } from '../services/closet';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];
const STYLE_TAGS = ['Casual', 'Formal', 'Streetwear', 'Vintage', 'Minimalist', 'Athleisure', 'Business Casual'];

const SIZE_SECTIONS = [
  { title: 'Clothing', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { title: 'Pants (waist)', sizes: ['28', '30', '32', '34', '36', '38', '40'] },
  { title: 'Shoes (US)', sizes: ['5', '6', '7', '8', '9', '10', '11', '12', '13'] },
];

export default function EditItemScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const item = route.params?.item ?? {};

  const [imageUri, setImageUri] = useState(item.imageURL ?? null);
  const [imageChanged, setImageChanged] = useState(false);
  const [name, setName] = useState(item.name ?? '');
  const [category, setCategory] = useState(item.category ?? '');
  const [size, setSize] = useState(item.size ?? '');
  const [brand, setBrand] = useState(item.brand ?? '');
  const [price, setPrice] = useState(item.price > 0 ? String(item.price) : '');
  const [currency, setCurrency] = useState(item.currency ?? '$');
  const [selectedTags, setSelectedTags] = useState(item.tags ?? []);
  const [loading, setLoading] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [customTags, setCustomTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    if (user?.uid) getCustomTags(user.uid).then(setCustomTags);
  }, [user?.uid]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'We need access to your photos.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); setImageChanged(true); }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'We need camera access.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); setImageChanged(true); }
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

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Name required', 'Please enter a name for this item.'); return; }
    if (!category) { Alert.alert('Category required', 'Please select a category.'); return; }
    setLoading(true);
    try {
      let imageURL = item.imageURL;
      if (imageChanged) imageURL = await uploadItemImage(imageUri, user.uid);
      const parsedPrice = parseFloat(price) || 0;
      const updatedFields = {
        imageURL,
        name: name.trim(),
        category,
        size,
        brand: brand.trim(),
        price: parsedPrice,
        currency,
        tags: selectedTags,
        wornCount: item.wornCount ?? 0,
      };
      await updateClothingItem(user.uid, item.id, updatedFields);
      route.params?.onDone?.({ ...item, ...updatedFields });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Edit Item</Text>
        <TouchableOpacity style={[styles.saveBtn, loading && styles.saveBtnDisabled]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={[styles.photoBox, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={pickImage} activeOpacity={0.8}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={[styles.photoHint, { color: colors.textSecondary }]}>Tap to change photo</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.photoActions}>
          <TouchableOpacity onPress={pickImage}><Text style={styles.photoActionText}>Change Photo</Text></TouchableOpacity>
          <TouchableOpacity onPress={takePhoto}><Text style={styles.photoActionText}>Take Photo</Text></TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Item Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="e.g. Black Slim Fit Jeans"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          maxLength={60}
        />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Category *</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surface }, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.chipText, { color: colors.textPrimary }, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Brand</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="e.g. Nike, Zara, Thrift"
          placeholderTextColor={colors.textMuted}
          value={brand}
          onChangeText={setBrand}
          maxLength={40}
        />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Size</Text>
        <TouchableOpacity
          style={[styles.sizeDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowSizePicker(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.sizeDropdownText, { color: size ? colors.textPrimary : colors.textMuted }]}>
            {size || 'Select a size'}
          </Text>
          <Text style={[styles.sizeDropdownChevron, { color: colors.textMuted }]}>▾</Text>
        </TouchableOpacity>

        <Modal visible={showSizePicker} transparent animationType="slide" onRequestClose={() => setShowSizePicker(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSizePicker(false)} />
          <View style={[styles.sizeSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sizeSheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sizeSheetTitle, { color: colors.textPrimary }]}>Select Size</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {SIZE_SECTIONS.map(section => (
                <View key={section.title}>
                  <Text style={[styles.sizeSectionLabel, { color: colors.textSecondary, borderBottomColor: colors.border }]}>
                    {section.title}
                  </Text>
                  {section.sizes.map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.sizeRow, { borderBottomColor: colors.border }, size === s && { backgroundColor: colors.surface }]}
                      onPress={() => { setSize(s); setShowSizePicker(false); }}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.sizeRowText, { color: colors.textPrimary }, size === s && { color: COLORS.primary, fontWeight: '700' }]}>
                        {s}
                      </Text>
                      {size === s && <Text style={styles.sizeCheck}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Price Paid</Text>
        <View style={styles.priceRow}>
          {['$', '£', '€', '¥', '₩'].map(c => (
            <TouchableOpacity key={c} style={[styles.currencyBtn, { borderColor: colors.border }, currency === c && styles.currencyBtnActive]} onPress={() => setCurrency(c)}>
              <Text style={[styles.currencyText, { color: colors.textPrimary }, currency === c && styles.currencyTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder={`${currency}0.00`}
          placeholderTextColor={colors.textMuted}
          value={price}
          onChangeText={text => {
            const cleaned = text.replace(/[^0-9.]/g, '');
            const parts = cleaned.split('.');
            const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
            setPrice(sanitized);
          }}
          keyboardType="decimal-pad"
          maxLength={8}
        />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Style Tags</Text>
        <View style={styles.chipRow}>
          {[...STYLE_TAGS, ...customTags].map(tag => (
            <TouchableOpacity key={tag} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surface }, selectedTags.includes(tag) && styles.chipActive]} onPress={() => toggleTag(tag)}>
              <Text style={[styles.chipText, { color: colors.textPrimary }, selectedTags.includes(tag) && styles.chipTextActive]}>{tag}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.chip, styles.addTagChip, { borderColor: colors.border }]} onPress={() => setShowTagInput(true)}>
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>+ Create</Text>
          </TouchableOpacity>
        </View>
        {showTagInput && (
          <View style={[styles.tagInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.tagInputField, { color: colors.textPrimary }]}
              placeholder="New tag name…"
              placeholderTextColor={colors.textMuted}
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
              <Text style={[styles.tagInputCancelText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md, borderBottomWidth: 1 },
  cancelText: { fontSize: FONT_SIZE.md, fontWeight: '500' },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full, minWidth: 60, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  scroll: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  photoBox: { width: '100%', height: 240, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.sm, borderWidth: 1 },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  photoIcon: { fontSize: 40 },
  photoHint: { fontSize: FONT_SIZE.md, fontWeight: '500' },
  photoActions: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.xl, marginBottom: SPACING.md },
  photoActionText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.sm, marginTop: SPACING.md },
  input: { borderWidth: 1, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONT_SIZE.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full, borderWidth: 1 },
  chipActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  chipText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  chipTextActive: { color: COLORS.white, fontWeight: '700' },
  sizeDropdown: { borderWidth: 1, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sizeDropdownText: { fontSize: FONT_SIZE.md },
  sizeDropdownChevron: { fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sizeSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: SPACING.sm, maxHeight: '65%' },
  sizeSheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.md },
  sizeSheetTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  sizeSectionLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: SPACING.md, paddingVertical: 10, borderBottomWidth: 1 },
  sizeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 16, borderBottomWidth: 1 },
  sizeRowText: { fontSize: FONT_SIZE.md },
  sizeCheck: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: '700' },
  priceRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  currencyBtn: { width: 40, height: 40, borderRadius: BORDER_RADIUS.full, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  currencyBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  currencyText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  currencyTextActive: { color: COLORS.white, fontWeight: '700' },
  addTagChip: { borderStyle: 'dashed' },
  tagInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm, marginTop: SPACING.sm, height: 44 },
  tagInputField: { flex: 1, fontSize: FONT_SIZE.sm, paddingVertical: 0 },
  tagInputConfirm: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: BORDER_RADIUS.sm, marginLeft: SPACING.sm },
  tagInputConfirmText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  tagInputCancel: { paddingHorizontal: SPACING.sm, paddingVertical: 6 },
  tagInputCancelText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
});
