import Link from "next/link";
import { GateMark } from "@/components/brand/GateMark";
import {
  button,
  buttonSecondary,
  container,
  ctaRow,
  cx,
  eyebrow,
  hero,
  heroHeading,
  lede,
} from "@/components/ui/styles";

// Static on purpose (no CMS query): it must render even if the CMS is
// unreachable.
export default function NotFound() {
  return (
    <main id="main" className={cx(hero, "flex min-h-[70vh] items-center")}>
      {/* React hoists this into <head>; the catch-all's metadata has no route to describe. */}
      <title>Page not found — Z-GATE Solution</title>
      <div className={container}>
        <div>
          <GateMark className="mb-6 w-14" />
          <p className={eyebrow}>404</p>
          <h1 className={heroHeading}>This door doesn&rsquo;t lead anywhere</h1>
          <p className={lede}>
            The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
          </p>
          <div className={ctaRow}>
            <Link href="/" className={button}>
              Go to the homepage
            </Link>
            <Link href="/contact" className={buttonSecondary}>
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
