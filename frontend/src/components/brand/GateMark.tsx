import { useId } from "react";
import type { DivisionSlug } from "@zgate/cms-contracts";

/**
 * The Gate Mark, geometry copied from the Brand Identity Guide: the letter
 * Z rebuilt as a gate - lintel, base, and a diagonal threshold beam. The
 * master mark has paper pillars and the indigo-to-cyan beam; a division
 * mark is drawn entirely in that division's colour ("each division owns
 * exactly one current"). Never mirrored, rotated or recoloured otherwise.
 */
export function GateMark({
  division,
  className = "gate-mark",
  title,
}: {
  division?: DivisionSlug;
  className?: string;
  /** Only when the mark stands alone as the link or image; decorative otherwise. */
  title?: string;
}) {
  const gradientId = `gate-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const solid = division ? `var(--${division})` : null;
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      {solid ? null : (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5B6BFA" />
            <stop offset="100%" stopColor="#34E0C9" />
          </linearGradient>
        </defs>
      )}
      <rect x="14" y="14" width="72" height="11" rx="2" fill={solid ?? "var(--paper)"} />
      <rect x="14" y="75" width="72" height="11" rx="2" fill={solid ?? "var(--paper)"} />
      <line
        x1="22"
        y1="30"
        x2="78"
        y2="70"
        stroke={solid ?? `url(#${gradientId})`}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Mark + wordmark: "Z-GATE Solution", or "Z-GATE Advisory" for a division. */
export function Lockup({ division, name }: { division?: DivisionSlug; name: string }) {
  return (
    <span className={division ? `lockup tone--${division}` : "lockup"}>
      <GateMark division={division} className="gate-mark lockup__mark" />
      <span className="lockup__word">
        Z-GATE <span className="lockup__name">{name}</span>
      </span>
    </span>
  );
}
