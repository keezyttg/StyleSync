export const ACCESSORY_PLACEMENTS = [
  { id: 'head', label: 'Head', hint: 'Hat / headwear', tag: 'accessory:head' },
  { id: 'neck', label: 'Neck', hint: 'Necklace / chain / choker', tag: 'accessory:neck' },
  { id: 'wrist', label: 'Wrist', hint: 'Watch / bracelet', tag: 'accessory:wrist' },
  { id: 'ankle', label: 'Ankle', hint: 'Anklet', tag: 'accessory:ankle' },
];

const ACCESSORY_PLACEMENT_BY_ID = Object.fromEntries(
  ACCESSORY_PLACEMENTS.map(placement => [placement.id, placement])
);

const ACCESSORY_PLACEMENT_BY_TAG = Object.fromEntries(
  ACCESSORY_PLACEMENTS.map(placement => [placement.tag, placement.id])
);

const LEGACY_PLACEMENT_ALIASES = {
  head: 'head',
  hat: 'head',
  headwear: 'head',
  neck: 'neck',
  necklace: 'neck',
  chain: 'neck',
  choker: 'neck',
  wrist: 'wrist',
  watch: 'wrist',
  bracelet: 'wrist',
  cuff: 'wrist',
  ankle: 'ankle',
  anklet: 'ankle',
};

export function normalizeAccessoryTag(tag) {
  return String(tag ?? '').trim().toLowerCase();
}

export function stripAccessoryPlacementTags(tags = []) {
  return tags.filter(tag => {
    const normalized = normalizeAccessoryTag(tag);
    return !ACCESSORY_PLACEMENT_BY_TAG[normalized];
  });
}

export function getAccessoryPlacement(value) {
  const item = Array.isArray(value) ? { tags: value } : value ?? {};
  const tags = item.tags ?? [];

  for (const tag of tags) {
    const normalized = normalizeAccessoryTag(tag);
    if (ACCESSORY_PLACEMENT_BY_TAG[normalized]) return ACCESSORY_PLACEMENT_BY_TAG[normalized];
    if (LEGACY_PLACEMENT_ALIASES[normalized]) return LEGACY_PLACEMENT_ALIASES[normalized];
  }

  const source = `${item.name ?? ''} ${tags.join(' ')}`.toLowerCase();
  if (/(hat|cap|beanie|headband|headwear)/.test(source)) return 'head';
  if (/(necklace|chain|choker|pendant|neck)/.test(source)) return 'neck';
  if (/(watch|bracelet|cuff|wrist)/.test(source)) return 'wrist';
  if (/(anklet|ankle)/.test(source)) return 'ankle';
  return 'default';
}

export function buildItemTags(baseTags = [], category, accessoryPlacement) {
  const tags = stripAccessoryPlacementTags(baseTags);
  if (category === 'Accessories' && accessoryPlacement && ACCESSORY_PLACEMENT_BY_ID[accessoryPlacement]) {
    tags.push(ACCESSORY_PLACEMENT_BY_ID[accessoryPlacement].tag);
  }
  return [...new Set(tags)];
}
