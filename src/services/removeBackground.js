import * as FileSystem from 'expo-file-system/legacy';

export async function removeBackground(imageUri) {
  const formData = new FormData();
  formData.append('image_file', { uri: imageUri, name: 'image.jpg', type: 'image/jpeg' });
  formData.append('size', 'auto');

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': process.env.EXPO_PUBLIC_REMOVEBG_API_KEY },
    body: formData,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j.errors?.[0]?.title ?? msg; } catch {}
    throw new Error(msg);
  }

  // Response is binary PNG — save to cache so React Native can use it as a URI
  const blob = await res.blob();
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const localUri = `${FileSystem.cacheDirectory}bg_${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(localUri, base64, { encoding: 'base64' });
  return localUri;
}
