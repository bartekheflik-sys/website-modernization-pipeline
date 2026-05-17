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
ANIMATION PHILOSOPHY: Rich, high-motion, cinematic design that drives engagement and elevates brand premiumness. Use physics-based spring animations for a hyper-responsive feel.
SMOOTH INERTIAL SCROLLING: Integrate smooth inertial scroll control (like Lenis Scroll or native JS smooth-damping) globally on the viewport.
TRANSITIONS: Spring physics (stiffness: 100, damping: 15) for responsive elements.
HERO ANIMATIONS:
  - Headline: Animate characters/words in sequentially with spring transitions (stagger 60ms)
  - Subtext: Smooth fade-in slide-up 150ms after headline completes
  - CTA button: Spring scales from 0.5 to 1.0 with overshoot after subtext
  - Background: Full-bleed background layer with smooth parallax scroll (scales slightly on scroll, translations linked to scroll progress via Framer Motion useScroll and useTransform)
HOVER BEHAVIOR:
  - Cards / Lists: Spring translate translateY(-10px) + premium soft colored glow drop shadow + border glow (250ms spring)
  - Buttons: Shimmer gradient effect + scale(1.05) + hover elevation shadow
  - Product/Menu thumbnails: Micro zoom on parent hover (scale 1.08, rounded container overflow hidden, 400ms transition)
SCROLL ANIMATIONS:
  - Staggered Entrances: Fade-in and slide-up child items sequentially as sections cross 80% viewport depth
  - Parallax Organics: Foreground decorative elements float at a different speed than text
  - Reveal Effects: Clip-path wipes and scroll-linked scale/opacity fades
MICROINTERACTIONS:
  - Navigation: Header background starts transparent, transitions to highly-blurred backdrop glassmorphism with smooth color blend upon scrolling down.
  - Active nav indicator slides dynamically beneath selected tab.
  - Form field focus: Spring overshoot pop-in for placeholders and subtle glowing rings.
PAGE TRANSITIONS: Crossfade + subtle entrance zoom scale (0.95→1) with spring (450ms).
LOADING STATES: Shimmer skeleton cards, animated brand-colored pulse loaders.
CURSOR: Custom interactive desktop cursor (fluid center dot + spring-lag ring that scales up on hover of clickable elements).`
  };

  return `
==================================================
F. MOTION SYSTEM RULES
==================================================

MOTION LEVEL: ${level.toUpperCase()}
${systems[level]}
`.trim();
}
