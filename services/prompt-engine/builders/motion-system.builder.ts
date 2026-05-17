import { AIAnalysisOutput } from '../schemas/analysis.schema';

export function buildMotionSystem(analysis: AIAnalysisOutput): string {
  const { design_direction } = analysis;
  const level = design_direction.motion_level;

  const systems = {
    low: `
ANIMATION PHILOSOPHY: Functional only. Motion exists to provide feedback, not decoration.
TRANSITIONS: 150ms ease-in-out for all state changes (hover, focus, active)
HOVER BEHAVIOR: Color shift only on buttons (no movement). Underline on links.
SCROLL ANIMATIONS: None. Content loads instantly.
MICROINTERACTIONS: Button press state (scale 0.98). Form field focus border glow.
PAGE TRANSITIONS: Instant. No crossfade.
LOADING STATES: Simple spinner or skeleton screens.`,

    medium: `
ANIMATION PHILOSOPHY: Purposeful motion that guides attention and confirms interactions.
TRANSITIONS: 250–400ms ease-out for primary transitions, 150ms for microinteractions.
HOVER BEHAVIOR:
  - Cards: translateY(-4px) + shadow deepens (200ms ease-out)
  - Buttons: background darken 10% + subtle scale(1.02) (150ms)
  - Nav links: underline slides in from left (200ms)
SCROLL ANIMATIONS:
  - Sections fade in as they enter viewport (opacity 0→1, translateY 24px→0, 400ms ease-out)
  - Stagger child elements with 60ms delay between each
  - Trigger: when element is 80% visible in viewport
MICROINTERACTIONS:
  - Button click: scale(0.97) press feel
  - Form field focus: border color transition + subtle inner glow
  - Checkbox/toggle: smooth state transition
PAGE TRANSITIONS: Subtle fade (300ms) between routes.
LOADING STATES: Skeleton screens matching content layout.`,

    high: `
ANIMATION PHILOSOPHY (LAZAREV AGENCY / ELVA-LABS CINEMATIC MOTION):
- Treat the entire interface as an active, living, high-end organic canvas. 
- Implement a hyper-premium digital experience that combines smooth fluid spring animations, interactive camera guides, and organic liquid morphing elements.
- Utilize GSAP or Framer Motion to drive physics-based spring curves (stiffness: 120, damping: 14) for incredibly satisfying, high-fidelity tactile feedback.

1. THE LIVING ORGANIC PERSONA & LIQUID BLOB MORPHS:
   - Ambient Background: Integrate beautifully blurred ambient sunset or purple-indigo radial glow blobs behind content layers.
   - Organic Morphing Blobs: Create a floating decorative background "Persona" blob using an SVG or custom HTML div that constantly warps and morphs organically using a CSS @keyframes animation that cycles through border-radius values (e.g. keyframes 0% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70% } 50% { border-radius: 50% 60% 30% 70% / 50% 60% 40% 60% } 100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70% }).
   - Glassmorphic Cards: All structural cards must be highly polished glass plates (backdrop-filter: blur(16px), border: 1px solid rgba(255,255,255,0.08), background: rgba(10,10,10,0.4)) with subtle chromatic aberration outlines to look premium and digital.

2. CINEMATIC CAMERA RETICLES & ALIGNMENT FRAMES:
   - Frame overlays: Place ultra-thin (0.5px), sharp camera crop lines, corner guides, or alignment target reticles in neon outlines overlaying primary photos (like product thumbnails or hero visuals) to match Elva's UI framing aesthetic.
   - Interactive Parallax Guides: On mouse hover of cards, let these camera guidelines dynamically scale, pivot slightly, or rotate in a circular flow path (matching Elva's "Flow Arcs" and "Lighting Spot" alignment UI).

3. LAZAREV FLOW ARCS SCROLL REVEALS:
   - Instead of standard vertical fade-ins, elements must enter the viewport by sliding along curved orbital paths ("Flow Arcs"). 
   - Implement this using Framer Motion combined translations: as the element becomes 80% visible, animate x: [80, 0], y: [40, 0], rotate: [12, 0], scale: [0.94, 1] with a smooth spring transition.
   - Stagger the children sequentially with a 65ms spring offset.

4. MAGNETIC CURSOR & SUNSET GLOW:
   - Custom Desktop Cursor: Enforce a custom cursor consisting of a small center dot and a lag-ring. On hover of buttons or menu cards, the outer ring must warp, expand, and magnetic-snap to the button's bounds, while applying a glowing sunset light spot under the mouse.

5. NON-CASUAL PAGE FLOW:
   - Desktop Horizontal Scroll Showcase: Category showcases (e.g., project galleries or menus) must use position: sticky and horizontal transforms mapped to the vertical scroll progress to pull the user smoothly sideways before continuing down.
   - Stacked Specialty Card Decks: Specialty items must stack cleanly on top of each other dynamically on scroll using position: sticky and scroll-linked scale-down to create a highly premium stacked visual deck.
   - Infinite ambient marquee typography running at low opacity (0.04) in opposite directions behind sections.

LEGIBILITY GUARDRAILS:
   - Keep all copy, paragraphs, and description text 100% static to guarantee absolute readability and reader comfort. Only animate structural frames, borders, cards, and accent graphics.`
  };

  return `
==================================================
F. MOTION SYSTEM RULES
==================================================

MOTION LEVEL: ${level.toUpperCase()}
${systems[level]}
`.trim();
}
