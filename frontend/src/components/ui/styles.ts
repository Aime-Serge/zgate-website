/**
 * Class strings shared by many components, so a button or a section looks
 * the same everywhere without repeating a long list of utilities. Plain
 * strings (not runtime-built) so Tailwind finds every class.
 */

/** Joins class names, skipping empty ones. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

/** Centred content column: 1200px max, 16px gutters on phones, 24px from 640px. */
export const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6";

/** Vertical rhythm of a page section. */
export const section = "py-16 lg:py-28";

/** A feature band on the indigo-tinted surface (figures, pillars). */
export const band = "bg-ink-3";

/** A hairline above a section that follows another (brand guide style). */
export const sectionRule = "border-t border-line";

/*
 * Buttons are complete variants, never a base plus overrides: when two
 * utilities set the same property on one element, Tailwind's CSS order -
 * not the order in the class string - decides which wins.
 */
const buttonShape =
  "inline-flex items-center rounded-full border font-semibold no-underline transition-colors duration-150 ease-out";
const primary = "border-transparent bg-action text-white hover:bg-action-hover";
const secondary = "border-paper-dim bg-transparent text-paper hover:bg-paper/8";

/** Primary action. Background tuned for AA contrast (see globals.css). */
export const button = `${buttonShape} min-h-12 justify-center px-6 py-3 ${primary}`;

/** Secondary action (WhatsApp, call, email beside a primary): outline, paper text on ink. */
export const buttonSecondary = `${buttonShape} min-h-12 justify-center px-6 py-3 ${secondary}`;

/** Header-sized primary button: still a 44px touch target. */
export const buttonSmall = `${buttonShape} min-h-11 justify-center px-4 py-2 text-sm ${primary}`;
/** Its outline partner (a course card's "Details" beside its enroll action). */
export const buttonSmallSecondary = `${buttonShape} min-h-11 justify-center px-4 py-2 text-sm ${secondary}`;

/** Contact channel buttons: full width, label left and number or address right. */
export const channelButton = `${buttonShape} min-h-12 w-full flex-wrap justify-between gap-2 px-6 py-3 ${primary}`;
export const channelButtonSecondary = `${buttonShape} min-h-12 w-full flex-wrap justify-between gap-2 px-6 py-3 ${secondary}`;

/** A row of actions: full-width stacked on phones, side by side from 480px. */
export const ctaRow = "mt-8 flex flex-wrap gap-3 *:flex-[1_1_100%] xs:*:flex-none";

/**
 * The brand guide's eyebrow: mono, uppercase, a leading hairline, in the tone's accent.
 * Tighter tracking on phones keeps a full line ("Where business meets
 * technology") on one row instead of stranding the hairline beside two.
 */
export const eyebrow =
  "mb-4 flex items-center gap-2.5 font-mono text-xs tracking-[0.1em] text-accent uppercase sm:tracking-[0.18em] before:inline-block before:h-px before:w-[22px] before:bg-current before:content-['']";

/** Mono, uppercase metadata labels (facts, footer headings, figure notes). */
export const label = "font-mono text-xs tracking-[0.08em] text-paper-dim uppercase";

/** A section's h2. */
export const sectionHeading = "text-balance text-title font-bold";

/** A large card: the page's main building surface. */
export const card = "rounded-2xl border border-line bg-ink-2";

/** A card that is one big link: lifts and takes the accent edge on hover. */
export const cardLink =
  "group flex h-full flex-col rounded-2xl border border-line bg-ink-2 no-underline transition-[border-color,transform,background-color] duration-150 hover:-translate-y-0.5 hover:border-accent";

/** Small mono chip (status, category) in the tone's accent. */
export const chip =
  "inline-flex items-center rounded-full border border-accent/40 bg-glow px-3 py-1 font-mono text-xs tracking-[0.1em] text-accent uppercase";

/** Arrow link at the foot of a card or row: label, then an arrow that moves on hover. */
export const arrowLink =
  "inline-flex items-center gap-2 font-semibold text-paper no-underline [&>svg]:transition-transform [&>svg]:duration-150 group-hover:[&>svg]:translate-x-1 hover:[&>svg]:translate-x-1";

/** Lead paragraph under a page headline. */
export const lede = "max-w-[62ch] text-lede text-paper-dim";

/** Small square bullet in the tone's accent, for checklists. */
export const checkItem =
  "relative pl-6 before:absolute before:top-[0.55em] before:left-0 before:size-2 before:rounded-sm before:bg-accent before:content-['']";

/** A grid of cells separated by 1px hairlines (the brand guide's tile grid). */
export const hairlineGrid = "grid gap-px overflow-hidden rounded-2xl border border-line bg-line";

/** Mono "Go" link text at the bottom of a card. */
export const goLink = "mt-auto font-mono text-xs tracking-[0.06em] text-accent uppercase";

/**
 * Page hero: the brand guide's cover glow, indigo top-left and cyan
 * bottom-right. A room's hero (division, course) glows in its own tone.
 */
export const hero =
  "relative bg-[radial-gradient(ellipse_900px_520px_at_8%_0%,rgb(91_107_250/0.2),transparent_62%),radial-gradient(ellipse_700px_480px_at_95%_100%,rgb(52_224_201/0.1),transparent_60%)] pt-12 pb-16 lg:py-24";
export const heroRoom =
  "relative bg-[radial-gradient(ellipse_900px_520px_at_8%_0%,var(--glow-strong),transparent_62%),radial-gradient(ellipse_700px_480px_at_95%_100%,var(--glow),transparent_60%)] pt-12 pb-16 lg:py-24";

/** The page's h1 in a hero. */
export const heroHeading = "mb-6 max-w-[20ch] text-balance text-display font-bold";
/** A division or course h1: longer lines, a step smaller. */
export const roomHeading = "mb-6 max-w-[24ch] text-balance text-headline font-bold";

/** Lockup row above a room's headline: the lockup, then a mono subtitle. */
export const heroLockup = "mb-6 flex flex-wrap items-center gap-x-4 gap-y-2";
export const heroSubtitle =
  "font-mono text-xs tracking-[0.12em] text-paper-dim uppercase sm:border-l sm:border-line sm:pl-4";

/** Mono line in the accent under a headline (the audience line). */
export const heroAudience = "mb-4 font-mono text-sm text-accent";

/**
 * Closing call to action. A threshold, so it carries the gate gradient;
 * inside a division it glows in that division's tone instead.
 */
export const ctaBand =
  "rounded-2xl border border-gate-1/35 bg-ink-2 bg-[radial-gradient(ellipse_80%_120%_at_0%_0%,rgb(91_107_250/0.25),transparent_60%),radial-gradient(ellipse_80%_120%_at_100%_100%,rgb(52_224_201/0.16),transparent_60%)] px-6 py-12 text-center";
/** Alignment is left to the caller (text-center or not), so nothing conflicts. */
export const ctaBandRoom =
  "rounded-2xl border border-line bg-ink-2 bg-[radial-gradient(ellipse_80%_120%_at_0%_0%,var(--glow-strong),transparent_60%),radial-gradient(ellipse_80%_120%_at_100%_100%,rgb(52_224_201/0.12),transparent_60%)] px-6 py-12";

/** Rich text from the CMS (Lexical output has no classes of its own). */
export const prose =
  "[&_:is(p,h2,h3)]:max-w-[70ch] [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_:is(p,li)]:text-lg [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:text-paper-dim [&_p+p]:mt-4 [&_ul]:list-disc [&_ul]:pl-6";

/** Two columns from 900px: copy beside a panel, or a form beside channels. */
export const split = "grid items-start gap-12 nav:grid-cols-2";
export const formSplit = "grid gap-12 nav:grid-cols-[3fr_2fr] nav:items-start";

/** A raised panel with an accent top edge (what's included, outcomes). */
export const panel = "rounded-2xl border border-t-2 border-line border-t-accent bg-ink-2 px-6 py-8";

/** Course cards, one column then two. */
export const courseGrid = "grid gap-4 md:grid-cols-2";
