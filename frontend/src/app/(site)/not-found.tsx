import Link from "next/link";
import { GateMark } from "@/components/brand/GateMark";

// Static on purpose (no CMS query): it must render even if the CMS is
// unreachable.
export default function NotFound() {
  return (
    <main id="main" className="hero not-found">
      {/* React hoists this into <head>; the catch-all's metadata has no route to describe. */}
      <title>Page not found — Z-GATE Solution</title>
      <div className="max hero__inner">
        <div className="hero__text">
          <GateMark className="gate-mark not-found__mark" />
          <p className="eyebrow">404</p>
          <h1>This door doesn&rsquo;t lead anywhere</h1>
          <p className="lede">
            The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
          </p>
          <div className="cta-row">
            <Link href="/" className="button">
              Go to the homepage
            </Link>
            <Link href="/contact" className="button button--secondary">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
