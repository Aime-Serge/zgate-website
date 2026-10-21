import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";
import type React from "react";
import { cx } from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
// Only the weights the site uses: every weight is another font download.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600"],
});
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

/**
 * Public-site root layout. Intentionally free of CMS queries: anything
 * prerendered at build time (like the not-found page) must not need the
 * CMS. Header and footer are rendered by each page instead.
 *
 * The body carries the brand surface (ink, paper text, Inter) and the gate
 * tone as the default accent. Heading typography is in globals.css's base
 * layer, so any utility on a heading still overrides it.
 */
const JS_FLAG = "document.documentElement.classList.add('js')";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script below adds the `js` class
    // before React hydrates, which is the point - only <html> is exempted.
    <html
      lang="en"
      suppressHydrationWarning
      className={cx(
        spaceGrotesk.variable,
        inter.variable,
        ibmPlexMono.variable,
        "scroll-smooth motion-reduce:scroll-auto",
      )}
    >
      <head>
        {/* Marks the page as scripted before first paint, so tabs and
            menus render in their final layout (no shift on hydration);
            without JavaScript, globals.css shows their content in full. */}
        <script dangerouslySetInnerHTML={{ __html: JS_FLAG }} />
      </head>
      <body
        className={cx(
          tone("gate"),
          "bg-ink font-body text-base leading-normal text-paper antialiased",
        )}
      >
        <a
          href="#main"
          className="absolute top-0 -left-[9999px] z-[100] rounded-br-md bg-paper px-4 py-3 text-ink focus:left-0"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
