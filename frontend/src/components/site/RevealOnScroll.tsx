"use client";

import type React from "react";
import { useEffect, useState } from "react";

/**
 * Holds the floating contact buttons back until the visitor scrolls past
 * the first screen, and tucks them away again at the foot of the page. At
 * both ends the page shows the same actions itself, and floating copies
 * would sit on top of its text or its links.
 *
 * The hidden state is CSS keyed off `html.js` (globals.css), so there is no
 * flash before hydration, and without JavaScript the buttons simply show.
 * Hidden also means `visibility: hidden`: keyboard focus never lands on an
 * invisible button.
 */
export function RevealOnScroll({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    // Shown between the first screen and the end of the page: at the very
    // bottom the footer has its own contact buttons, and the floating ones
    // would cover its social links.
    const update = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.6;
      const atEnd =
        window.scrollY + window.innerHeight > document.documentElement.scrollHeight - 280;
      setShown(pastHero && !atEnd);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <div data-reveal data-shown={shown ? "" : undefined} className={className}>
      {children}
    </div>
  );
}
