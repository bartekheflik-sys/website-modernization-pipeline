export interface DesignDNA {
  id: string;
  name: string;
  description: string;
  suitable_for: string[];
  design_style: string;
  animation_style: string;
  color_direction: string;
  typography_direction: string;
}

export const DESIGN_DNA_LIBRARY: DesignDNA[] = [
  {
    id: "dna_synthesis",
    name: "Synthesis Capital (Premium Finance / VC)",
    description: "Highly professional, clean, and data-driven. Communicates extreme trust, institutional backing, and modern financial sophistication.",
    suitable_for: ["Finance", "Venture Capital", "Corporate", "Consulting", "Enterprise SaaS"],
    design_style: "Ultra-clean institutional minimalism. Vast white/off-white space, subtle borders, rigorous geometric grid systems. Highly structured and authoritative.",
    animation_style: "Restrained, buttery smooth micro-interactions. Slow fade-ins, subtle parallax on data elements, elegant line-drawing reveals.",
    color_direction: "Monochromatic base (charcoals, slates, alabaster) with one highly specific, sophisticated accent color (e.g., deep emerald, rich navy, or metallic copper).",
    typography_direction: "Modern geometric sans-serifs (like Inter, Roobert, or Swiss 721) mixed with highly legible data-tables."
  },
  {
    id: "dna_balmoral",
    name: "Balmoral Running (Dynamic Active / Sports)",
    description: "High-energy, bold, and momentum-driven. Communicates movement, human performance, and modern lifestyle.",
    suitable_for: ["Sports", "Fitness", "Apparel", "Event Management", "Lifestyle"],
    design_style: "Bold, punchy layout with edge-to-edge imagery. Brutalist touches with overlapping text and imagery. Highly visual, relying on powerful photography.",
    animation_style: "Aggressive and kinetic. Text revealing on scroll, fast spring animations, image zoom-ins on hover, running marquees.",
    color_direction: "High contrast. Deep blacks, stark whites, and vibrant, energetic accents (neon lime, electric orange, or racing red).",
    typography_direction: "Oversized, tight-tracking grotesque fonts (like Helvetica Now Display, Monument Extended, or Anton) for massive impact."
  },
  {
    id: "dna_allia",
    name: "Allia Health (Modern Healthcare / Wellness)",
    description: "Warm, empathetic, and clinically precise. Communicates safety, modern care, and approachability.",
    suitable_for: ["Healthcare", "Wellness", "Therapy", "Beauty", "Organic Products"],
    design_style: "Soft UI, rounded corners, organic shapes, and lots of visual 'breathing room'. Emphasizes accessibility, warmth, and human connection.",
    animation_style: "Calming and organic. Soft blurs resolving into focus, gentle floating elements, smooth and slow state transitions. Nothing jarring.",
    color_direction: "Muted, natural palettes. Soft sages, warm sand, pale lavenders, and off-whites. Avoids harsh clinical blue/white.",
    typography_direction: "Friendly, legible humanist sans-serifs (like Lora, Recoleta, or Sofia Pro) mixed with elegant, readable body text."
  },
  {
    id: "dna_fauna",
    name: "Fauna Robotics (Deep Tech / Futuristic)",
    description: "Cutting-edge, precise, and highly technical. Communicates innovation, engineering excellence, and the future.",
    suitable_for: ["AI", "Robotics", "Deep Tech", "Software Infrastructure", "Cybersecurity"],
    design_style: "Dark mode default. Highly technical aesthetic with subtle grid lines, glowing borders, glassmorphism, and hardware-inspired UI components.",
    animation_style: "Physics-based, sharp, and computational. Code-typing effects, 3D tilt hover effects, glowing trail animations, complex data visualizations.",
    color_direction: "Deep space blacks and dark graphites, illuminated by glowing technical accents (cyber cyan, neon purple, or laser green).",
    typography_direction: "Monospace accents combined with stark, technical sans-serifs (like JetBrains Mono, Space Grotesk, or Roboto Mono)."
  },
  {
    id: "dna_lesse",
    name: "Lesse Studio (Avant-Garde Minimalist)",
    description: "Extremely reductive, confident, and editorial. Communicates luxury, exclusivity, and pure aesthetic focus.",
    suitable_for: ["Creative Agencies", "High-end Fashion", "Art Galleries", "Luxury Goods", "Architecture"],
    design_style: "Radical minimalism. Massive whitespace, asymmetrical layouts, tiny navigational elements. Lets the work speak entirely for itself.",
    animation_style: "Cinematic and deliberate. Slow cross-fades, horizontal scrolling sections, image distortion on scroll, custom cursor blending.",
    color_direction: "Strictly neutral. Pure blacks, pure whites, warm greys, and unbleached linen tones.",
    typography_direction: "High-contrast serif typography (like Playfair Display or Ogg) used at massive scale, paired with microscopic sans-serif utility text."
  },
  {
    id: "dna_ozgur",
    name: "Ozgur Design (Creative Interactive Portfolio)",
    description: "Highly experimental, playful, and deeply interactive. Showcases frontend mastery and creative thinking.",
    suitable_for: ["Digital Creators", "Web3", "Freelance Portfolios", "Interactive Campaigns"],
    design_style: "Boundary-pushing UI. Floating elements, unconventional navigation patterns, rich media integration, and highly customized interactive cursors.",
    animation_style: "Rich GSAP-style sequencing. Text splitting animations, liquid distortion effects, morphing shapes, and scroll-scrubbed video.",
    color_direction: "Vibrant, unexpected color pairings. Gradients, grain filters, and bold, playful color blocking.",
    typography_direction: "Eclectic typography. Mixing wildly different font weights, experimental variable fonts, and kinetic typography."
  },
  {
    id: "dna_sondaven",
    name: "Sondaven (Premium Corporate / Heritage)",
    description: "Timeless, highly crafted, and sophisticated. Communicates heritage, absolute quality, and global reach.",
    suitable_for: ["Real Estate", "Wealth Management", "Law Firms", "High-end Hospitality", "Corporate Holding"],
    design_style: "Editorial grid systems, refined spacing, thin elegant dividers, and high-quality atmospheric photography.",
    animation_style: "Stately and refined. Slow image scaling (Ken Burns effect), elegant wipe transitions, and subtle parallax scrolling.",
    color_direction: "Rich, deeply saturated natural tones. Forest greens, midnight blues, deep burgundies, paired with gold/champagne accents and cream backgrounds.",
    typography_direction: "Classic, highly legible serif headings (like Garamond or Baskerville) paired with elegant, tracked-out sans-serif subheadings."
  },
  {
    id: "dna_chronicle",
    name: "Chronicle (Editorial Blog / Magazine / News)",
    description: "Reading-focused, warm, and highly scannable. Designed for dense content without feeling cluttered.",
    suitable_for: ["Blog", "News", "Magazine", "Personal Site", "Educational"],
    design_style: "Editorial layout, max-width text columns for readability, distinct card grids for post feeds, warm off-white backgrounds.",
    animation_style: "Subtle fade-ins on scroll. Focus is on static text readability, with very light hover states on article cards.",
    color_direction: "Paper and ink feel. Warm off-white backgrounds, deep charcoal text, and subtle muted accent colors (e.g. brick red or sage green).",
    typography_direction: "Beautiful serif headings (e.g. Merriweather, Lora, PT Serif) paired with highly legible sans-serif body text (e.g. Inter or Roboto)."
  },
  {
    id: "dna_launchpad",
    name: "Launchpad (SaaS / Startup / Landing Page)",
    description: "High-conversion, feature-driven, and punchy. Designed to communicate product value quickly and drive signups.",
    suitable_for: ["SaaS", "Landing Page", "Software", "Tech Startup", "Product Launch"],
    design_style: "Vibrant and structured. Clean feature grids, alternating text/image blocks, prominent social proof and pricing tables.",
    animation_style: "Snappy spring animations, staggering feature lists, interactive hover states on cards, and sticky scroll sections.",
    color_direction: "Clean white/light gray backgrounds with vibrant primary brand colors (e.g. electric blue, vivid purple) for buttons and active states.",
    typography_direction: "Punchy, modern sans-serifs (e.g. Poppins, Plus Jakarta Sans, Outfit) for clear, bold feature communication."
  }
];

export function getDesignDNA(id: string, websiteType?: string): DesignDNA {
  const found = DESIGN_DNA_LIBRARY.find(dna => dna.id === id);
  if (found) return found;
  
  // Safe fallback based on website_type
  let fallbackId = 'dna_lesse'; // Default clean minimalist
  
  if (websiteType) {
    if (['blog', 'news', 'educational', 'personal'].includes(websiteType)) fallbackId = 'dna_chronicle';
    else if (['saas', 'landing_page'].includes(websiteType)) fallbackId = 'dna_launchpad';
    else if (['corporate', 'ecommerce'].includes(websiteType)) fallbackId = 'dna_synthesis';
    else if (['portfolio'].includes(websiteType)) fallbackId = 'dna_ozgur';
    else if (['restaurant'].includes(websiteType)) fallbackId = 'dna_sondaven';
  }
  
  console.warn(`[Design DNA] Unknown DNA id "${id}" — falling back to ${fallbackId} based on type ${websiteType}`);
  return DESIGN_DNA_LIBRARY.find(dna => dna.id === fallbackId) || DESIGN_DNA_LIBRARY[0];
}
