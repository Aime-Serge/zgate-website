/**
 * Division tones - "each division owns exactly one current" (Brand
 * Identity Guide). A tone class sets three CSS variables on its element;
 * everything inside reads them through the accent utilities defined in
 * globals.css (text-accent, bg-accent, border-accent, bg-glow, ...). The
 * gate tone (indigo-to-cyan) is the master brand's.
 *
 * Full class strings on purpose: Tailwind only generates classes it can
 * find written out in the source.
 */
const TONES = {
  gate: "[--accent:var(--color-gate-2)] [--glow:rgb(52_224_201/0.1)] [--glow-strong:rgb(91_107_250/0.22)]",
  bundle:
    "[--accent:var(--color-gate-2)] [--glow:rgb(52_224_201/0.1)] [--glow-strong:rgb(91_107_250/0.22)]",
  advisory:
    "[--accent:var(--color-advisory)] [--glow:rgb(201_161_90/0.1)] [--glow-strong:rgb(201_161_90/0.2)]",
  academy:
    "[--accent:var(--color-academy)] [--glow:rgb(63_174_122/0.1)] [--glow-strong:rgb(63_174_122/0.2)]",
  tech: "[--accent:var(--color-tech)] [--glow:rgb(63_140_250/0.1)] [--glow-strong:rgb(63_140_250/0.22)]",
  data: "[--accent:var(--color-data)] [--glow:rgb(168_92_246/0.1)] [--glow-strong:rgb(168_92_246/0.22)]",
} as const;

export type Tone = keyof typeof TONES;

/** The tone class for a division slug (or "bundle"); the gate tone otherwise. */
export function tone(name?: string | null): string {
  return name && name in TONES ? TONES[name as Tone] : TONES.gate;
}
