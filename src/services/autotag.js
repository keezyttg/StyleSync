import Anthropic from '@anthropic-ai/sdk';
import * as FileSystem from 'expo-file-system';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
});

const STYLE_TAGS = ['Casual', 'Formal', 'Streetwear', 'Vintage', 'Minimalist', 'Athleisure', 'Business Casual'];

export async function autoTagImage(imageUri) {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 128,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
          },
          {
            type: 'text',
            text: `Look at this clothing item. From these style tags pick all that apply: ${STYLE_TAGS.join(', ')}. Reply with ONLY a JSON array, e.g. ["Casual","Minimalist"]. No explanation.`,
          },
        ],
      },
    ],
  });

  try {
    const raw = message.content[0].text.trim();
    const parsed = JSON.parse(raw);
    return parsed.filter(t => STYLE_TAGS.includes(t));
  } catch {
    return [];
  }
}
