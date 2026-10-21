import type React from "react";
import { cx } from "./styles";

/**
 * A row of cards that drifts slowly sideways and loops, like a marquee.
 * No scrollbar and no controls: the movement is the whole interaction. It
 * pauses while the pointer is over it, so a card can be read in full.
 *
 * The loop: the cards are rendered twice and the track slides left by half
 * its width, so the copy takes the original's place without a jump. The
 * copy is aria-hidden and inert: screen readers and the keyboard meet each
 * card once. The animation is CSS (globals.css, `[data-marquee]`), so this
 * needs no JavaScript.
 *
 * Visitors whose device asks for reduced motion get every card at once,
 * still, wrapped into rows.
 */
export function Marquee({
  label,
  items,
  secondsPerItem = 9,
}: {
  /** Accessible name, e.g. "Situations we handle". */
  label: string;
  /** The cards' contents, one per item (each is wrapped in an <li>). */
  items: { key: string; className?: string; content: React.ReactNode }[];
  /** Speed: how long each card takes to pass. */
  secondsPerItem?: number;
}) {
  const card = "w-[min(80vw,24rem)] shrink-0 pr-4 motion-reduce:pb-4";
  return (
    <div
      role="region"
      aria-label={label}
      data-marquee
      style={{ "--marquee-duration": `${items.length * secondsPerItem}s` } as React.CSSProperties}
      className="overflow-hidden motion-reduce:mx-auto motion-reduce:max-w-[1200px] motion-reduce:px-4 sm:motion-reduce:px-6"
    >
      <ul
        data-marquee-track
        className="flex w-max list-none motion-reduce:w-auto motion-reduce:flex-wrap"
      >
        {items.map((item) => (
          <li key={item.key} className={cx(card, item.className)}>
            {item.content}
          </li>
        ))}
        {items.map((item) => (
          <li
            key={`copy-${item.key}`}
            className={cx(card, "motion-reduce:hidden", item.className)}
            aria-hidden="true"
            inert
          >
            {item.content}
          </li>
        ))}
      </ul>
    </div>
  );
}
