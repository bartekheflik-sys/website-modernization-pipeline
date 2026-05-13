import { AIAnalysisOutput } from '../schemas/analysis.schema';

export function buildGlobalInstructions(analysis: AIAnalysisOutput): string {
  const { design_direction, ux_analysis } = analysis;
  const motionLevel = design_direction.motion_level;

  const motionDescriptions = {
    low: 'Use minimal, functional animations only. Subtle fade-ins for content loading. No scroll-triggered effects. Clean, fast static transitions.',
    medium: 'Use tasteful scroll-triggered fade-ins, smooth section transitions (300–500ms ease-out), gentle hover scale effects (1.02), and micro-interactions on buttons. No flashy or disruptive effects.',
    high: 'Use rich motion design: parallax hero sections, staggered list animations, smooth page transitions, morphing shapes, animated counters, advanced hover effects (lift + glow), and fluid scroll-triggered reveals.'
  };

  return `
==================================================
A. GLOBAL WEBSITE INSTRUCTIONS
==================================================

DESIGN LANGUAGE:
${design_direction.ui_direction}

BRAND STYLE: ${design_direction.brand_style}

MODERNITY LEVEL:
Build a state-of-the-art modern website, NOT a template. The output must feel premium, high-end, and polished. Every section must have intentional spacing, clear visual hierarchy, and professional typography.

MOTION SYSTEM (Level: ${motionLevel.toUpperCase()}):
${motionDescriptions[motionLevel]}

SPACING PHILOSOPHY:
Use generous padding and breathing room. Minimum 80px vertical padding per section on desktop. Content should never feel cramped or text-heavy without visual relief.

RESPONSIVENESS REQUIREMENTS:
- Mobile-first development approach
- Full mobile breakpoint: 100% viewport width, single column layout
- Tablet (768px–1024px): 2-column grid where applicable
- Desktop (1280px+): Full multi-column layouts as designed
- Navigation must collapse to hamburger menu on mobile
- All CTAs must remain visible and tappable on mobile (min 44px touch target)
- No horizontal overflow at any breakpoint

ACCESSIBILITY:
- Semantic HTML5 elements (nav, main, section, article, footer)
- All images must have alt attributes
- Color contrast must meet WCAG AA standards
- Focus states must be visible for keyboard navigation

QUALITY GATE:
Every section must be production-ready. No placeholder content. No "Lorem ipsum". Use industry-appropriate copy derived from the business context below.
`.trim();
}
