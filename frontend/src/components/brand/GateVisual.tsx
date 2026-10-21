import { useId } from "react";
import type { Division } from "@zgate/cms-contracts";

const ROOM_Y = [24, 98, 172, 246];
const ROOM_H = 52;

/**
 * "One gate, four rooms" drawn: the master Gate Mark, and a current in each
 * division's colour running from the threshold to its room. Decorative -
 * the hero's text says the same thing - so it is hidden from assistive
 * technology. Inline SVG, a couple of kilobytes, no script.
 */
export function GateVisual({ divisions }: { divisions: Division[] }) {
  const gradientId = `gate-visual-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const rooms = divisions.slice(0, 4);
  return (
    <svg
      viewBox="0 0 560 322"
      className="h-auto w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5B6BFA" />
          <stop offset="100%" stopColor="#34E0C9" />
        </linearGradient>
      </defs>
      {/* The mark at 2.7x: same geometry as GateMark. */}
      <g transform="translate(-8 26) scale(2.7)">
        <rect x="14" y="14" width="72" height="11" rx="2" fill="var(--color-paper)" />
        <rect x="14" y="75" width="72" height="11" rx="2" fill="var(--color-paper)" />
        <line
          x1="22"
          y1="30"
          x2="78"
          y2="70"
          stroke={`url(#${gradientId})`}
          strokeWidth="9"
          strokeLinecap="round"
        />
      </g>
      {rooms.map((division, index) => {
        const y = ROOM_Y[index] ?? 0;
        const mid = y + ROOM_H / 2;
        const color = `var(--color-${division.slug})`;
        return (
          <g key={division.id}>
            <path
              d={`M 228 161 C 290 161, 280 ${mid}, 334 ${mid}`}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <rect
              x="334"
              y={y}
              width="224"
              height={ROOM_H}
              rx="6"
              fill="var(--color-ink-2)"
              stroke={color}
              strokeOpacity="0.55"
            />
            <circle cx="356" cy={mid} r="5" fill={color} />
            <text x="372" y={mid - 3} className="fill-paper font-display text-[17px] font-semibold">
              {division.shortName}
            </text>
            <text
              x="372"
              y={mid + 14}
              className="fill-paper-dim font-mono text-[11px] tracking-[0.08em] uppercase"
            >
              {division.pillar ?? ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
