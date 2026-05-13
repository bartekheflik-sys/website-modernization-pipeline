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
ANIMATION PHILOSOPHY: Rich, cinematic motion that builds brand personality and delights users.
TRANSITIONS: Spring physics (stiffness: 200, damping: 20) for primary elements. 300ms ease-out for secondary.
HERO ANIMATIONS:
  - Headline: Words animate in sequentially with spring (stagger 80ms per word)
  - Subtext: Fade in 200ms after headline completes
  - CTA button: Scale up from 0.8 with spring after subtext
  - Background: Subtle parallax scroll (moves at 0.3x scroll speed)
HOVER BEHAVIOR:
  - Cards: translateY(-8px) + glow shadow + border color shift (250ms spring)
  - Buttons: shimmer effect + scale(1.04) + shadow lift
  - Images: subtle zoom (scale 1.05, overflow hidden, 400ms ease-out)
SCROLL ANIMATIONS:
  - Sections animate in with stagger: each child delays 80ms
  - Numbers/stats: count-up animation when entering viewport
  - Images: reveal with clip-path wipe (400ms ease-out)
MICROINTERACTIONS:
  - Form submission: button morphs to loading spinner then success checkmark
  - Navigation: active link animates with indicator slide
  - Tooltips: spring pop-in with slight overshoot
PAGE TRANSITIONS: Crossfade + slight scale (0.98→1) on enter (400ms).
LOADING STATES: Animated skeleton with shimmer effect.
CURSOR: Custom cursor on desktop (dot + ring that follows with spring lag).`
  };

  return `
==================================================
F. MOTION SYSTEM RULES
==================================================

MOTION LEVEL: ${level.toUpperCase()}
${systems[level]}
`.trim();
}
