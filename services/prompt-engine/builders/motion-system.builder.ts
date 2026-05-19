import { AIAnalysisOutput } from '../schemas/analysis.schema';

export function buildMotionSystem(analysis: AIAnalysisOutput): string {
  const { design_direction } = analysis;
  const level = design_direction.motion_level;

  const systems = {
    low: `
ANIMATION PHILOSOPHY: Functional only. Motion exists to provide feedback, not decoration.
TRANSITIONS: 150ms ease-in-out for all state changes (hover, focus, active) — use transition-[var(--transition-smooth)] Tailwind token.
HOVER BEHAVIOR: Color shift only on buttons (no movement). Underline on links.
SCROLL ANIMATIONS: None. Content loads instantly.
MICROINTERACTIONS: Button press state (scale-[0.98]). Form field focus border glow using ring-primary/50.
PAGE TRANSITIONS: Instant. No crossfade.
LOADING STATES: Simple spinner or Skeleton components from shadcn.`,

    medium: `
ANIMATION PHILOSOPHY: Purposeful motion that guides attention and confirms interactions.
TRANSITIONS: 250–400ms ease-out for primary transitions, 150ms for microinteractions — use transition-[var(--transition-smooth)].
HOVER BEHAVIOR:
  - Cards: -translate-y-1 + shadow-[var(--shadow-card-hover)] (200ms ease-out)
  - Buttons: hover:opacity-90 + scale-[1.02] (150ms) using transition-[var(--transition-spring)]
  - Nav links: underline slides in from left (200ms)
SCROLL ANIMATIONS (Framer Motion):
  - Sections: initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}
  - Stagger children with staggerChildren: 0.06
  - Trigger when element is 80% visible in viewport (whileInView)
MICROINTERACTIONS:
  - Button click: scale-[0.97] press feel
  - Form field focus: ring-2 ring-primary/30 transition
  - Checkbox/toggle: smooth state transition via shadcn components
PAGE TRANSITIONS: Subtle fade (300ms) between routes using AnimatePresence.
LOADING STATES: Skeleton components matching content layout.`,

    high: `
ANIMATION PHILOSOPHY (LAZAREV AGENCY / ELVA-LABS CINEMATIC MOTION):
- Treat the entire interface as an active, living, high-end organic canvas.
- Implement a hyper-premium digital experience that combines smooth fluid spring animations, interactive camera guides, and organic liquid morphing elements.
- Utilize Framer Motion to drive physics-based spring curves: transition={{ type: "spring", stiffness: 120, damping: 14 }} for incredibly satisfying, high-fidelity tactile feedback.

1. THE LIVING ORGANIC PERSONA & LIQUID BLOB MORPHS:
   - Ambient Background: Integrate beautifully blurred radial glow blobs behind content layers using bg-[hsl(var(--primary-glow)/0.15)] with blur-3xl absolute positioning.
   - Organic Morphing Blobs: Create a floating decorative background "Persona" blob using an SVG or custom div with a CSS @keyframes animation cycling through border-radius values (e.g. 0%: 30% 70% 70% 30% / 30% 30% 70% 70% → 50%: 50% 60% 30% 70% / 50% 60% 40% 60%).
   - Glassmorphic Cards: All structural cards must be polished glass plates using the glass card variant (bg-[hsl(var(--surface)/0.4)] backdrop-blur-[var(--glass-blur)] border-[hsl(var(--glass-border))]) defined in the design system. Never hardcode rgba() values in components.

2. CINEMATIC CAMERA RETICLES & ALIGNMENT FRAMES:
   - Frame overlays: Place ultra-thin (border or outline with opacity-20) camera crop lines, corner guides, or alignment reticles overlaying primary photos.
   - Interactive Parallax Guides: On card hover, let camera guidelines dynamically rotate/scale via Framer Motion whileHover.

3. LAZAREV FLOW ARCS SCROLL REVEALS (Framer Motion):
   - Elements enter via curved orbital paths: initial={{ x: 80, y: 40, rotate: 12, scale: 0.94 }} whileInView={{ x: 0, y: 0, rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 120, damping: 14 }}
   - Stagger children with staggerChildren: 0.065

4. MAGNETIC CURSOR & GLOW:
   - Custom desktop cursor: small center dot + lag-ring using Framer Motion useMotionValue for x/y tracking.
   - On button hover: outer ring expands and snaps with a glowing hsl(var(--primary-glow)) light spot under mouse.

5. ⚠️ MANDATORY 3D ANIMATIONS & SPATIAL DEPTH ⚠️ (INDUSTRY: ${analysis.industry}):
   - THIS IS NON-NEGOTIABLE: You MUST bring the website to life! Use Framer Motion's 3D transform properties (rotateX, rotateY, perspective) to create extreme spatial depth.
   - You MUST implement 3D card tilt effects (e.g. whileHover={{ rotateX: 10, rotateY: -10, scale: 1.05 }} style={{ perspective: 1000 }}).
   - You MUST place abstract 3D geometric shapes or industry-specific floating assets behind the content layers, rotating slowly via useAnimationFrame, to create a living, breathing canvas.

6. ⚠️ MANDATORY PARALLAX & SCROLL EFFECTS ⚠️:
   - HERO PARALLAX IS REQUIRED: You MUST map the scroll Y-position to the hero background image scale and Y-translate using useScroll and useTransform. The background MUST move slower than the foreground.
   - HORIZONTAL SCROLL SHOWCASE: Category showcases (menus, galleries) MUST use sticky + horizontal transforms mapped to vertical scroll progress.
   - STACKED DECKS: Specialty items MUST use sticky + scroll-linked scale-down via useTransform for a premium stacked visual deck.
   - Infinite ambient marquee typography at opacity-[0.04] running in opposite directions behind sections.

LEGIBILITY GUARDRAILS:
   - Keep all copy, paragraphs, and description text 100% static. Only animate structural frames, borders, cards, and accent graphics. Text must always be text-foreground with no motion applied.`
  };

  return `
==================================================
F. MOTION SYSTEM RULES
==================================================

MOTION LEVEL: ${level.toUpperCase()}
${systems[level]}
`.trim();
}
