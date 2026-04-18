// StyleSync autoTagImage v2
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const Anthropic = require('@anthropic-ai/sdk');

const anthropicKey = defineSecret('ANTHROPIC_API_KEY');

exports.autoTagImage = onRequest(
  { secrets: [anthropicKey], timeoutSeconds: 120, cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { imageBase64, mediaType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'imageBase64 is required' });
      return;
    }

    try {
      const client = new Anthropic({ apiKey: anthropicKey.value() });

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Analyze this clothing item and return ONLY a JSON object with these fields:
- "category": one of exactly ["Tops","Bottoms","Outerwear","Shoes","Accessories"]
- "color": primary color like "Black", "White", "Navy Blue", "Gray", "Beige"
- "itemType": specific item like "Hoodie", "Jeans", "Sneakers", "Jacket", "T-Shirt"
- "brand": brand name if a logo is visible, otherwise null
- "tags": array from exactly ["Casual","Formal","Streetwear","Vintage","Minimalist","Athleisure","Business Casual"]

Reply with ONLY valid JSON. Example:
{"category":"Tops","color":"Black","itemType":"Hoodie","brand":"Nike","tags":["Casual","Streetwear"]}`,
            },
          ],
        }],
      });

      const raw = message.content[0].text.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/,'');
      const parsed = JSON.parse(raw);

      const VALID_CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];
      const VALID_TAGS = ['Casual', 'Formal', 'Streetwear', 'Vintage', 'Minimalist', 'Athleisure', 'Business Casual'];

      const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : null;
      const tags = Array.isArray(parsed.tags) ? parsed.tags.filter(t => VALID_TAGS.includes(t)) : ['Casual'];
      const color = typeof parsed.color === 'string' ? parsed.color : null;
      const itemType = typeof parsed.itemType === 'string' ? parsed.itemType : null;
      const brand = typeof parsed.brand === 'string' ? parsed.brand : null;
      const suggestedName = [color, itemType].filter(Boolean).join(' ') || null;

      res.json({ tags, category, color, brand, suggestedName });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
