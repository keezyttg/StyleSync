import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Dimensions, StatusBar, Animated, Easing,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState(null);

  const cameraRef = useRef(null);
  const shutterScale = useRef(new Animated.Value(1)).current;
  const previewOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  // Flash through: off → on → auto
  const FLASH_STATES = ['off', 'on', 'auto'];
  const FLASH_ICONS = { off: '🚫', on: '⚡', auto: 'A' };
  function cycleFlash() {
    setFlash(f => {
      const idx = FLASH_STATES.indexOf(f);
      return FLASH_STATES[(idx + 1) % FLASH_STATES.length];
    });
  }

  async function takePhoto() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);

    // Shutter animation
    Animated.sequence([
      Animated.timing(shutterScale, { toValue: 0.82, duration: 80, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.timing(shutterScale, { toValue: 1, duration: 120, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      setPreview(photo.uri);
      Animated.timing(previewOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } catch (err) {
      console.log('Camera error:', err);
    } finally {
      setCapturing(false);
    }
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (!result.canceled) {
      setPreview(result.assets[0].uri);
      Animated.timing(previewOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }

  function retake() {
    Animated.timing(previewOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setPreview(null));
  }

  function usePhoto() {
    const uri = preview;
    navigation.replace('Post', { imageUri: uri });
  }

  if (!permission) return <View style={styles.bg} />;

  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permTitle}>Camera Access</Text>
        <Text style={styles.permSub}>StyleSync needs camera access to let you capture outfits.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permSkip} onPress={() => navigation.goBack()}>
          <Text style={styles.permSkipText}>Not now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.bg}>
      <StatusBar hidden />

      {/* Live camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
      />

      {/* Gradient overlays for top/bottom legibility */}
      <View style={styles.topGradient} pointerEvents="none" />
      <View style={styles.bottomGradient} pointerEvents="none" />

      {/* ─── Top controls ─── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.iconText}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={cycleFlash}>
          <Text style={[styles.iconText, flash === 'on' && styles.iconTextActive]}>
            {FLASH_ICONS[flash]}
          </Text>
          {flash === 'auto' && <Text style={styles.flashLabel}>AUTO</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
          <Text style={styles.iconText}>⟳</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Bottom controls ─── */}
      <View style={styles.bottomBar}>
        {/* Gallery shortcut */}
        <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}>
          <Text style={styles.galleryIcon}>🖼</Text>
        </TouchableOpacity>

        {/* Shutter */}
        <Animated.View style={{ transform: [{ scale: shutterScale }] }}>
          <TouchableOpacity style={styles.shutterOuter} onPress={takePhoto} activeOpacity={1}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </Animated.View>

        {/* Spacer for symmetry */}
        <View style={styles.galleryBtn} />
      </View>

      {/* ─── Preview overlay ─── */}
      {preview && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: previewOpacity }]}>
          <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="cover" />

          {/* Top: retake */}
          <View style={styles.previewTop}>
            <TouchableOpacity style={styles.previewIconBtn} onPress={retake}>
              <Text style={styles.previewIconText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom: use photo */}
          <View style={styles.previewBottom}>
            <TouchableOpacity style={styles.useBtn} onPress={usePhoto}>
              <Text style={styles.useBtnText}>Use Photo</Text>
              <Text style={styles.useBtnArrow}> ›</Text>
            </TouchableOpacity>
          </View>

          {/* Retake label */}
          <TouchableOpacity style={styles.retakeLabel} onPress={retake}>
            <Text style={styles.retakeLabelText}>Retake</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },

  topGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 140,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // Top bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
  },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 22, color: '#fff', fontWeight: '700' },
  iconTextActive: { color: COLORS.star },
  flashLabel: { fontSize: 8, color: '#fff', fontWeight: '900', marginTop: -2 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 52, paddingHorizontal: 40,
  },
  galleryBtn: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  galleryIcon: { fontSize: 30 },

  // Shutter
  shutterOuter: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  shutterInner: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#fff',
  },

  // Preview
  previewImage: { width: SW, height: SH },
  previewTop: {
    position: 'absolute', top: 56, left: 20,
  },
  previewIconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  previewIconText: { fontSize: 18, color: '#fff', fontWeight: '700' },
  previewBottom: {
    position: 'absolute', bottom: 52, right: 24,
  },
  useBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 9999,
  },
  useBtnText: { fontSize: 17, fontWeight: '800', color: '#000' },
  useBtnArrow: { fontSize: 20, fontWeight: '800', color: '#000' },
  retakeLabel: {
    position: 'absolute', bottom: 62, left: 24,
  },
  retakeLabelText: { fontSize: 16, color: '#fff', fontWeight: '600' },

  // Permission screen
  permContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 40 },
  permTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 12 },
  permSub: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  permBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 9999, marginBottom: 16 },
  permBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  permSkip: { paddingVertical: 10 },
  permSkipText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
});
