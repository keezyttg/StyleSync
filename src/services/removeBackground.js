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

  // Response is binary PNG — convert to base64 without FileReader (not available in Hermes)
  const arrayBuffer = await res.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) binary += String.fromCharCode(uint8Array[i]);
  const base64 = btoa(binary);

  const localUri = `${FileSystem.cacheDirectory}bg_${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(localUri, base64, { encoding: 'base64' });
  return localUri;
}
