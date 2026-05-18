import { AIAnalysisOutput } from '../schemas/analysis.schema';

export function buildDesignSystem(analysis: AIAnalysisOutput): string {
  const { design_direction } = analysis;

  return `
==================================================
D. DESIGN SYSTEM
==================================================

⚠️ CRITICAL: All values below must be implemented as tokens in index.css and tailwind.config.ts FIRST. Never apply these as inline styles or ad-hoc Tailwind classes in components.

TYPOGRAPHY DIRECTION:
${design_direction.typography_direction}
Define in index.css as:
  --font-heading: [chosen font family];
  --font-body: [chosen font family];
Tailwind scale: text-5xl (Hero H1) → text-4xl (H2) → text-3xl (H3) → text-xl (H4) → text-base (body)
font-weight: font-bold or font-extrabold for headings (700-800), font-normal for body (400)
line-height: leading-tight (1.15) for headings, leading-relaxed (1.7) for body

COLOR SYSTEM DIRECTION:
${design_direction.color_direction}
Implement as HSL tokens in index.css (see section A for the full token schema).
Shadcn component color mapping:
  - Primary actions → bg-primary text-primary-foreground
  - Page background → bg-background text-foreground
  - Cards/panels → bg-surface (or bg-card) text-foreground
  - Borders → border-border
  - Captions → text-muted-foreground

SPACING:
8px base grid. Use Tailwind spacing: p-2 / p-4 / p-6 / p-8 / p-12 / p-16 / p-20 / p-24 / p-32

BORDER RADIUS — define in tailwind.config.ts:
  --radius-btn: 6px  → rounded (buttons)
  --radius-card: 14px → rounded-xl (cards)
  --radius-input: 8px → rounded-lg (inputs)
  --radius-modal: 18px → rounded-2xl (modals/sheets)

CARD COMPONENT VARIANT — add to card.tsx:
  glass: "bg-[hsl(var(--surface)/0.4)] backdrop-blur-[var(--glass-blur)] border border-[hsl(var(--foreground)/0.08)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-[var(--transition-smooth)]"

BUTTON VARIANTS — add to button.tsx:
  primary: "bg-primary text-primary-foreground font-semibold min-w-[140px] h-11 shadow-sm hover:opacity-90 transition-[var(--transition-smooth)]"
  secondary: "border border-primary bg-transparent text-primary hover:bg-primary/10 font-semibold min-w-[140px] h-11 transition-[var(--transition-smooth)]"
  ghost: "bg-transparent text-foreground hover:underline font-medium"

SHADOW TOKENS — already defined in index.css (section A):
  Cards: shadow-[var(--shadow-card)] → hover: shadow-[var(--shadow-card-hover)]
  Nav: shadow-[var(--shadow-nav)] when scrolled
  Modals: shadow-2xl

ICON SYSTEM:
Use Lucide React. All icons consistent: size-5 (20px inline), size-6 (24px standalone). Match stroke weight to body text weight.
`.trim();
}
