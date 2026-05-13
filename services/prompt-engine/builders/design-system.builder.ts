import { AIAnalysisOutput } from '../schemas/analysis.schema';

export function buildDesignSystem(analysis: AIAnalysisOutput): string {
  const { design_direction } = analysis;

  return `
==================================================
D. DESIGN SYSTEM
==================================================

TYPOGRAPHY:
${design_direction.typography_direction}
- Heading scale: 4xl (Hero H1) → 3xl (H2) → 2xl (H3) → xl (H4) → base (body)
- Line height: 1.15 for headings, 1.7 for body text
- Heading font weight: 700–800 (bold, commanding)
- Body font weight: 400 (normal), 500 for emphasis

COLOR SYSTEM:
${design_direction.color_direction}
- Primary: Main brand action color (buttons, links, key accents)
- Primary Dark: Hover state for primary (10% darker)
- Background: Page background (near-white or deep dark)
- Surface: Card/panel background (subtle contrast from background)
- Border: Subtle separator lines (low opacity)
- Text Primary: Main content text (high contrast)
- Text Secondary: Captions, subtitles, metadata (60–70% opacity)

SPACING SYSTEM:
Use an 8px base grid. Standard spacers: 8 / 16 / 24 / 32 / 48 / 64 / 80 / 96 / 128px.

BORDER RADIUS:
- Buttons: 6–8px (slightly rounded, professional)
- Cards: 12–16px (modern, friendly)
- Input fields: 8px
- Modals/panels: 16–20px
- Avatar/image thumbnails: Full round (50%) or 12px

CARD STYLE:
- Background: Surface color
- Border: 1px solid Border color
- Box shadow: subtle (0 2px 12px rgba(0,0,0,0.07))
- Hover: lift shadow (0 8px 32px rgba(0,0,0,0.12)) + subtle border color shift
- Transition: 200ms ease-out

BUTTON STYLES:
- Primary: Solid fill with Primary color, white text, slight shadow, hover darkens 10%
- Secondary: Outlined with Primary color border, transparent background, hover fills lightly
- Ghost: No border, transparent, text underline on hover
- All buttons: font-weight 600, min-width 140px, 44px height, smooth 200ms transition

SHADOW PHILOSOPHY:
- Section backgrounds: No shadow
- Interactive cards: Elevation shadow on hover
- Fixed nav: Subtle bottom shadow (0 1px 16px rgba(0,0,0,0.08)) when scrolled
- Modal/dropdown: Strong shadow (0 16px 48px rgba(0,0,0,0.18))

ICON SYSTEM:
Use Lucide React or Heroicons. All icons must be consistent in size (20px inline, 24px standalone). Match stroke weight to body text weight.
`.trim();
}
