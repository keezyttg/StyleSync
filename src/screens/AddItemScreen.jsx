import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadItemImage, addClothingItem } from '../services/closet';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '6', '7', '8', '9', '10', '11', '12'];
const STYLE_TAGS = ['Casual', 'Formal', 'Streetwear', 'Vintage', 'Minimalist', 'Athleisure', 'Business Casual'];

export default function AddItemScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [currency, setCurrency] = useState('$');
  const [loading, setLoading] = useState(false);

  function autoSuggestTags(text) {
    const lower = text.toLowerCase();
    const suggestions = [];
    if (/(tee|shirt|hoodie|sweat|top|blouse|tank|crop)/i.test(lower)) suggestions.push('Casual');
    if (/(suit|blazer|dress|formal|tie)/i.test(lower)) suggestions.push('Formal');
    if (/(nike|adidas|jordan|yeezy|supreme|off.white|palace)/i.test(lower)) suggestions.push('Streetwear');
    if (/(vintage|thrift|retro|90s|80s|y2k)/i.test(lower)) suggestions.push('Vintage');
    if (/(lulu|gym|sport|yoga|run|active|athlet)/i.test(lower)) suggestions.push('Athleisure');
    if (/(zara|h&m|uniqlo|basic|simple|minimal)/i.test(lower)) suggestions.push('Minimalist');
    setSelectedTags(prev => [...new Set([...prev, ...suggestions])]);
  }

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

  async function handleSave() {
    if (!imageUri) { Alert.alert('Add a photo', 'Please take or upload a photo of the item.'); return; }
    if (!name.trim()) { Alert.alert('Name required', 'Please enter a name for this item.'); return; }
    if (!category) { Alert.alert('Category required', 'Please select a category.'); return; }
    setLoading(true);
    try {
      const imageURL = await uploadItemImage(imageUri, user.uid);
      await addClothingItem({ userId: user.uid, imageURL, name: name.trim(), category, size, brand: brand.trim(), price: parseFloat(price) || 0, currency, tags: selectedTags });
      Alert.alert('Added!', `${name} has been added to your closet.`);
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
        <Text style={[styles.title, { color: colors.textPrimary }]}>Add Item</Text>
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
              <Text style={[styles.photoHint, { color: colors.textSecondary }]}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>
        {imageUri && (
          <View style={styles.photoActions}>
            <TouchableOpacity onPress={pickImage}><Text style={styles.photoActionText}>Change Photo</Text></TouchableOpacity>
            <TouchableOpacity onPress={takePhoto}><Text style={styles.photoActionText}>Take Photo</Text></TouchableOpacity>
          </View>
        )}
        {!imageUri && (
          <TouchableOpacity style={styles.cameraAlt} onPress={takePhoto}>
            <Text style={styles.cameraAltText}>Take a Photo Instead</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.label, { color: colors.textPrimary }]}>Item Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="e.g. Black Slim Fit Jeans"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={t => { setName(t); autoSuggestTags(t); }}
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
          onChangeText={t => { setBrand(t); autoSuggestTags(t); }}
          maxLength={40}
        />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Size</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeScroll}>
          <View style={styles.chipRow}>
            {SIZES.map(s => (
              <TouchableOpacity key={s} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surface }, size === s && styles.chipActive]} onPress={() => setSize(s)}>
                <Text style={[styles.chipText, { color: colors.textPrimary }, size === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

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
            // Strip everything except digits and one decimal point
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
          {STYLE_TAGS.map(tag => (
            <TouchableOpacity key={tag} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surface }, selectedTags.includes(tag) && styles.chipActive]} onPress={() => toggleTag(tag)}>
              <Text style={[styles.chipText, { color: colors.textPrimary }, selectedTags.includes(tag) && styles.chipTextActive]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

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
  cameraAlt: { alignItems: 'center', marginBottom: SPACING.md },
  cameraAltText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.sm, marginTop: SPACING.md },
  input: { borderWidth: 1, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONT_SIZE.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full, borderWidth: 1 },
  chipActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  chipText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  chipTextActive: { color: COLORS.white, fontWeight: '700' },
  sizeScroll: { marginBottom: SPACING.xs },
  priceRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  currencyBtn: { width: 40, height: 40, borderRadius: BORDER_RADIUS.full, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  currencyBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  currencyText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  currencyTextActive: { color: COLORS.white, fontWeight: '700' },
});
