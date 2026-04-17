const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const Anthropic = require('@anthropic-ai/sdk');

const anthropicKey = defineSecret('ANTHROPIC_API_KEY');

const STYLE_TAGS = [
  'Casual', 'Formal', 'Streetwear', 'Vintage',
  'Minimalist', 'Athleisure', 'Business Casual',
];

exports.autoTagImage = onCall({ secrets: [anthropicKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const { imageBase64, mediaType = 'image/jpeg' } = request.data;
  if (!imageBase64) {
    throw new HttpsError('invalid-argument', 'imageBase64 is required.');
  }

  const client = new Anthropic({ apiKey: anthropicKey.value() });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 128,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: imageBase64 },
        },
        {
          type: 'text',
          text: `Look at this clothing item. From these style tags pick all that apply: ${STYLE_TAGS.join(', ')}. Reply with ONLY a JSON array, e.g. ["Casual","Minimalist"]. No explanation.`,
        },
      ],
    }],
  });

  try {
    const raw = message.content[0].text.trim();
    const parsed = JSON.parse(raw);
    return { tags: parsed.filter(t => STYLE_TAGS.includes(t)) };
  } catch {
    return { tags: [] };
  }
});
