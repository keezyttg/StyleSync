import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { createCommunity } from '../services/communities';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const LABEL_OPTIONS = [
  'Streetwear', 'Minimalist', 'Formal', 'Casual', 'Vintage',
  'Athleisure', 'Summer', 'Winter', 'High Fashion', 'Cosplay',
  'Y2K', 'Cottagecore', 'Dark Academia', 'Business Casual',
];

export default function CreateCommunityScreen({ navigation }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [loading, setLoading] = useState(false);

  function toggleLabel(label) {
    setSelectedLabels(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  }

  async function handleCreate() {
    if (!name.trim()) { Alert.alert('Name required', 'Give your community a name.'); return; }
    if (!user) return;
    setLoading(true);
    try {
      const id = await createCommunity({
        name: name.trim(),
        description: bio.trim(),
        labels: selectedLabels,
        createdBy: user.uid,
        creatorName: user.displayName || 'User',
      });
      navigation.replace('CommunityDetail', {
        community: { id, name: name.trim(), description: bio.trim(), labels: selectedLabels, memberCount: 1, postCount: 0 },
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not create community.');
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
        <Text style={styles.title}>New Community</Text>
        <TouchableOpacity
          style={[styles.createBtn, loading && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : <Text style={styles.createBtnText}>Create</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Community Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. NYC Street Style"
          placeholderTextColor={COLORS.textMuted}
          value={name}
          onChangeText={setName}
          maxLength={50}
        />
        <Text style={styles.charCount}>{name.length}/50</Text>

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="What's this community about?"
          placeholderTextColor={COLORS.textMuted}
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={200}
        />
        <Text style={styles.charCount}>{bio.length}/200</Text>

        <Text style={styles.label}>Style Labels</Text>
        <Text style={styles.sublabel}>Help people find your community</Text>
        <View style={styles.chipGrid}>
          {LABEL_OPTIONS.map(label => (
            <TouchableOpacity
              key={label}
              style={[styles.chip, selectedLabels.includes(label) && styles.chipActive]}
              onPress={() => toggleLabel(label)}
            >
              <Text style={[styles.chipText, selectedLabels.includes(label) && styles.chipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md, borderBottomWidth: 1, borderColor: COLORS.border },
  cancelText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  createBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  createBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  scroll: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: 6 },
  sublabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginBottom: SPACING.sm, marginTop: -4 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  bioInput: { height: 100, textAlignVertical: 'top' },
  charCount: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: '500' },
  chipTextActive: { color: COLORS.white, fontWeight: '700' },
});
