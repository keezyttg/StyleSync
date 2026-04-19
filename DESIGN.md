# FashIQ Design System

This short design spec documents the core design tokens and usage guidance so developers and designers can apply consistent UI across the app.

## Goals
- Consistent visual language (colors, type, spacing)
- Easy developer adoption via tokens in `src/constants/theme.js`
- Accessibility: contrast and tappable sizes
- Small, practical set of components/presets to get started

## Tokens (overview)
All tokens are exported from `src/constants/theme.js`.

- COLORS — brand and semantic colors
- SPACING — 4pt baseline spacing scale
- BORDER_RADIUS — radius tokens for components
- FONT_SIZE — typographic scale
- TYPOGRAPHY — family, weights, lineHeight helpers
- ELEVATION — shadow/elevation presets
- SIZES — common element sizes

## Color usage
- Primary actions: `COLORS.primary` with `COLORS.primaryTextOnPrimary` for button text.
- Backgrounds: `COLORS.background` for screens, `COLORS.surface`/`COLORS.card` for cards.
- Text: `COLORS.textPrimary` for main copy; `COLORS.textSecondary` for metadata.
- Status: `COLORS.success`, `COLORS.error`, `COLORS.warning`, `COLORS.info`.

Contrast: prefer `textPrimary` on `background` for body copy; ensure a minimum of 4.5:1 contrast for small text.

## Spacing
Use `SPACING` values for margins and paddings. Use `gutter` (16) for horizontal container padding.

Examples:
- Page container: `paddingHorizontal: SPACING.gutter`
- Small gaps between chips: `gap: SPACING.sm`

## Typography
- Headline: `fontSize: FONT_SIZE.xxl`, `fontWeight: TYPOGRAPHY.weight.bold`
- Body: `fontSize: FONT_SIZE.md`, `lineHeight: TYPOGRAPHY.lineHeight.normal`

Use system fonts (fast and native). If a custom font is added later, update `TYPOGRAPHY.fontFamily`.

## Elevation / Shadows
Use `ELEVATION.low` for list items, `ELEVATION.medium` for modal cards, and `ELEVATION.high` for prominent floating elements.

Example usage (React Native):

```js
import { ELEVATION, SPACING, COLORS, BORDER_RADIUS } from '../constants/theme';

const cardStyle = {
  backgroundColor: COLORS.card,
  borderRadius: BORDER_RADIUS.md,
  padding: SPACING.md,
  ...ELEVATION.low,
};
```

## Button styles (recommended)
Primary button (filled):
- backgroundColor: `COLORS.primary`
- color: `COLORS.primaryTextOnPrimary`
- paddingVertical: `SPACING.sm + 4`
- borderRadius: `BORDER_RADIUS.full` or `BORDER_RADIUS.md`

Secondary button (outline):
- backgroundColor: `COLORS.card`
- borderColor: `COLORS.border`
- color: `COLORS.textPrimary`

## Empty states and CTAs
- Title: FONT_SIZE.xl, bold
- Body: FONT_SIZE.sm, textSecondary
- Primary CTA: Filled primary button with clear label (e.g., “Add your first piece”)

## Accessibility notes
- Ensure interactive targets >= 44x44 points using `hitSlop` when needed.
- Provide `accessibilityLabel` and `accessibilityRole` for non-text buttons.
- Support dynamic type: avoid fixed heights that clip larger fonts.

## Quick migration checklist
- Replace numeric colors inline with `COLORS.*` tokens
- Replace numeric paddings/margins with `SPACING.*`
- Use `BORDER_RADIUS.*` instead of raw numbers
- Use `ELEVATION.*` for shadows rather than ad-hoc styles

## Next steps / recommendations
1. Replace inline style numbers with tokens in key screens: `ClosetScreen`, `PostScreen`, `CameraScreen`.
2. Implement shared components: `Button`, `Card`, `TagChip`, `SkeletonLoader` that rely on tokens.
3. Create a small Figma file mirroring these tokens for design handoff.

---

If you want, I can now:
- Convert one or two screens to use the new tokens explicitly (example: `PostScreen` and `ClosetScreen`).
- Add a `Button` component and swap the Add/Post buttons to use it.

Which should I do next?
