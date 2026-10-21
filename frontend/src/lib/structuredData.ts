/**
 * schema.org descriptions of the company and the site, built only from
 * what Site settings already publish (no ratings, reviews or opening hours
 * we haven't confirmed). Rendered by components/site/JsonLd.tsx.
 */
import type { Division, SiteSetting } from "@zgate/cms-contracts";

export type Crumb = { label: string; href: string };

/**
 * The company as a local professional service (a schema.org LocalBusiness),
 * with the four divisions as its departments. Homepage only.
 */
export function organizationJsonLd(settings: SiteSetting, divisions: Division[], siteUrl: string) {
  const sameAs = (settings.social ?? []).map((entry) => entry.url);
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#organization`,
    name: settings.tradingName,
    legalName: settings.legalName,
    slogan: settings.motto,
    description: settings.boilerplate || settings.elevatorPitch,
    url: siteUrl,
    email: settings.email,
    telephone: settings.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressLocality: "Kigali",
      addressCountry: "RW",
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
    department: divisions.map((division) => ({
      "@type": "Organization",
      name: division.name,
      description: division.subtitle || division.mission,
      url: `${siteUrl}/${division.slug}`,
    })),
  };
}

/** The site, with its search box (lets search engines offer it directly). */
export function websiteJsonLd(settings: SiteSetting, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.tradingName,
    url: siteUrl,
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(trail: Crumb[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `${siteUrl}${crumb.href}`,
    })),
  };
}
