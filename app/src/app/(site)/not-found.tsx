import Link from "next/link";

// Static on purpose (no CMS query): it must render even if the database
// is unreachable.
export default function NotFound() {
  return (
    <main id="main" className="max block">
      <h1>Page not found</h1>
      <p>The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.</p>
      <p>
        <Link href="/" className="button">
          Go to the homepage
        </Link>
      </p>
    </main>
  );
}
