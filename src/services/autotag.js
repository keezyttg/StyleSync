import * as FileSystem from 'expo-file-system';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebase';

export async function autoTagImage(imageUri) {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const autoTag = httpsCallable(getFunctions(app), 'autoTagImage');
  const result = await autoTag({ imageBase64: base64 });
  return result.data.tags ?? [];
}
