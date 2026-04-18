import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

const AUTOTAG_URL = 'https://us-central1-stylesync-619ee.cloudfunctions.net/autoTagImage';

export async function autoTagImage(imageUri) {
  const resized = await manipulateAsync(
    imageUri,
    [{ resize: { width: 600 } }],
    { compress: 0.7, format: SaveFormat.JPEG }
  );

  const base64 = await FileSystem.readAsStringAsync(resized.uri, { encoding: 'base64' });

  const res = await fetch(AUTOTAG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64 }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  const data = await res.json();
  return {
    tags:          data.tags          ?? [],
    category:      data.category      ?? null,
    color:         data.color         ?? null,
    brand:         data.brand         ?? null,
    suggestedName: data.suggestedName ?? null,
  };
}
