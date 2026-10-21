"use client";

import type React from "react";
import { useId, useRef, useState } from "react";
import { cx } from "./styles";

export type TabItem = {
  /** Visible tab label. */
  label: string;
  /** Tone class for the tab and its panel (the division's colour). */
  toneClass?: string;
  panel: React.ReactNode;
};

/**
 * WAI-ARIA tabs: one tab stop, arrow keys (and Home/End) move between tabs,
 * the panel follows the selected tab.
 *
 * Without JavaScript, globals.css (`html:not(.js) [data-tabs]`) hides the
 * tab list and shows every panel under its own label, so nothing is locked
 * behind a script on a slow connection. The `js` class is set before first
 * paint (layout.tsx), so the tabbed layout never jumps on hydration.
 */
export function Tabs({
  items,
  label,
  className,
  tabListClassName,
}: {
  items: TabItem[];
  /** Accessible name of the tab list, e.g. "Divisions". */
  label: string;
  className?: string;
  tabListClassName?: string;
}) {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId().replace(/[^a-zA-Z0-9-]/g, "");

  const focusTab = (index: number) => {
    const next = (index + items.length) % items.length;
    setSelected(next);
    tabs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: items.length - 1,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    focusTab(target);
  };

  return (
    <div className={className} data-tabs>
      <div
        role="tablist"
        aria-label={label}
        className={cx(
          // Centred as a row (w-fit + mx-auto), not with justify-center: when
          // the tabs overflow a phone's width the row still scrolls from its
          // first tab instead of cutting it off on the left.
          "mx-auto flex w-fit max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          tabListClassName,
        )}
      >
        {items.map((item, index) => {
          const active = index === selected;
          return (
            <button
              key={item.label}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${index}`}
              aria-selected={active}
              aria-controls={`${base}-panel-${index}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cx(
                item.toneClass,
                "min-h-11 shrink-0 cursor-pointer rounded-full border px-4 py-2 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors duration-150",
                active
                  ? "border-accent bg-glow-strong text-paper"
                  : "border-line bg-transparent text-paper-dim hover:border-paper-dim hover:text-paper",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item, index) => (
        <div
          key={item.label}
          role="tabpanel"
          id={`${base}-panel-${index}`}
          aria-labelledby={`${base}-tab-${index}`}
          hidden={index !== selected}
          tabIndex={0}
          className={cx(item.toneClass, "mt-6 rounded-2xl focus-visible:outline-offset-4")}
        >
          {/* Shown only without JavaScript, when there is no tab list to name the panel. */}
          <p
            data-tab-label
            className="mb-4 font-mono text-xs tracking-[0.14em] text-accent uppercase"
          >
            {item.label}
          </p>
          {item.panel}
        </div>
      ))}
    </div>
  );
}
