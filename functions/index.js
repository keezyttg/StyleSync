const { onCall, HttpsError } = require('firebase-functions/v2/https');
const vision = require('@google-cloud/vision');

const visionClient = new vision.ImageAnnotatorClient();

const CATEGORY_KEYWORDS = {
  Tops:       ['shirt', 't-shirt', 'tshirt', 'blouse', 'top', 'hoodie', 'sweater', 'sweatshirt', 'cardigan', 'tank', 'pullover', 'turtleneck', 'polo', 'jersey'],
  Bottoms:    ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'joggers', 'chinos', 'slacks', 'denim'],
  Outerwear:  ['jacket', 'coat', 'blazer', 'vest', 'parka', 'windbreaker', 'overcoat', 'raincoat', 'bomber'],
  Shoes:      ['shoe', 'sneaker', 'boot', 'sandal', 'heel', 'loafer', 'oxford', 'trainer', 'slipper', 'flip flop'],
  Accessories:['hat', 'cap', 'bag', 'belt', 'scarf', 'watch', 'jewelry', 'necklace', 'bracelet', 'sunglasses', 'glasses', 'purse', 'backpack', 'glove'],
};

const STYLE_KEYWORDS = {
  Formal:          ['suit', 'blazer', 'dress shirt', 'tie', 'formal', 'tuxedo'],
  Streetwear:      ['hoodie', 'graphic', 'sneaker', 'tracksuit', 'cargo', 'beanie'],
  Athleisure:      ['athletic', 'sport', 'gym', 'yoga', 'running', 'leggings', 'track', 'activewear'],
  Vintage:         ['vintage', 'retro', 'classic', 'denim jacket', 'flannel'],
  Minimalist:      ['plain', 'simple', 'neutral', 'monochrome', 'basic'],
  'Business Casual':['chinos', 'polo', 'oxford', 'loafer', 'button'],
  Casual:          ['t-shirt', 'jeans', 'shorts', 'casual', 'everyday'],
};

function detectCategory(labels) {
  const lower = labels.map(l => l.toLowerCase());
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.some(l => l.includes(kw)))) return cat;
  }
  return null;
}

function detectStyleTags(labels) {
  const text = labels.map(l => l.toLowerCase()).join(' ');
  const found = Object.entries(STYLE_KEYWORDS)
    .filter(([, keywords]) => keywords.some(kw => text.includes(kw)))
    .map(([tag]) => tag);
  return found.length > 0 ? found : ['Casual'];
}

function rgbToColorName({ red = 0, green = 0, blue = 0 }) {
  const max = Math.max(red, green, blue);
  if (max < 50) return 'Black';
  if (red > 210 && green > 210 && blue > 210) return 'White';
  const spread = Math.max(Math.abs(red - green), Math.abs(green - blue), Math.abs(red - blue));
  if (spread < 35) return max < 100 ? 'Dark Gray' : max < 180 ? 'Gray' : 'Light Gray';
  if (red > green && red > blue) return blue > 120 ? 'Pink' : red > 200 && green > 100 ? 'Orange' : 'Red';
  if (green > red && green > blue) return 'Green';
  if (blue > red && blue > green) return red > 120 ? 'Purple' : 'Blue';
  if (red > 130 && green > 90 && blue < 60) return 'Brown';
  if (red > 150 && green > 150 && blue < 80) return 'Yellow';
  return 'Multicolor';
}

exports.autoTagImage = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const { imageBase64 } = request.data;
  if (!imageBase64) {
    throw new HttpsError('invalid-argument', 'imageBase64 is required.');
  }

  const image = { content: imageBase64 };

  const [labelResult, colorResult] = await Promise.all([
    visionClient.labelDetection({ image }),
    visionClient.imageProperties({ image }),
  ]);

  const labels = (labelResult[0].labelAnnotations ?? [])
    .filter(l => l.score > 0.65)
    .map(l => l.description);

  const dominantColors = colorResult[0].imagePropertiesAnnotation?.dominantColors?.colors ?? [];
  const color = dominantColors.length > 0 ? rgbToColorName(dominantColors[0].color) : null;

  const category = detectCategory(labels);
  const tags = detectStyleTags(labels);

  return { tags, category, color };
});
