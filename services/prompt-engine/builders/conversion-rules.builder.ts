import { AIAnalysisOutput } from '../schemas/analysis.schema';

export function buildConversionRules(analysis: AIAnalysisOutput): string {
  const { ux_analysis, lovable_prompt_data } = analysis;

  return `
==================================================
E. CONVERSION OPTIMIZATION RULES
==================================================

CURRENT CONVERSION SCORE: ${ux_analysis.conversion_score}/10
CTA QUALITY ASSESSMENT: ${ux_analysis.cta_quality}

CONVERSION GOALS (implement ALL of these):
${lovable_prompt_data.conversion_goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

STRICT FIDELITY LOCK:
- NEVER add new pages, forms, or "Online Order" systems if they break the original bookmark structure.
- Modernize existing CTAs, but do not invent new ones that require backend functionality (like ordering) if not present in the original.

MISSING ELEMENTS TO ADD (CRITICAL — these were absent in original site):
${ux_analysis.missing_elements.map(e => `- ${e}`).join('\n')}

USER JOURNEY ISSUES TO FIX:
${ux_analysis.user_journey_issues.map(i => `- ${i}`).join('\n')}

CTA STRATEGY:
- The PRIMARY CTA must appear within the first viewport (above the fold) on every page
- Use action-oriented verbs that are APPROPRIATE FOR THE INDUSTRY — e.g. "View Menu" for restaurants, "Book a Stay" for hotels, "Get Started" for SaaS. Never use passive text like "Click Here" or "Submit"
- Never add online ordering, cart, or payment CTAs unless the original site had these features
- Include a SECONDARY CTA (lower commitment) near the primary: e.g. "See Our Work" next to "Contact Us"

TRUST-BUILDING PLACEMENT:
- Place trust signals (client count, years of experience, certifications) directly below the hero
- Add social proof (testimonials or partner logos) before the contact section
- All statistics must be bold and visually emphasized (large number + small label)

LEAD GENERATION STRUCTURE:
- Every page must end with a contact/conversion opportunity
- The contact form must be visible without scrolling to the bottom (sticky sidebar or mid-page CTA)
- Use inline validation on form fields (real-time feedback)
- After form submission: show a success message, do NOT redirect to a blank page

MOBILE CONVERSION:
- All CTAs must be full-width on mobile (easier to tap)
- Floating "Contact Us" button (fixed position, bottom-right) on mobile only
- Phone numbers must be tel: links on mobile (tap to call)
- Forms must have large input fields (min 48px height) on mobile
`.trim();
}
