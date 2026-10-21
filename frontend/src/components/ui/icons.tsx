/**
 * The site's icons: inline SVG, drawn on a 24px grid with a 1.8px stroke in
 * currentColor, so they take the text colour (or a tone's accent) they sit
 * in. Decorative by default (aria-hidden); the text beside them carries the
 * meaning. No icon font or library - a few hundred bytes each, no request.
 */
import type React from "react";

type IconProps = { className?: string };

function Icon({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      className={className ?? "size-5"}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const ArrowLeft = (props: IconProps) => (
  <Icon {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);

export const Check = (props: IconProps) => (
  <Icon {...props}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);

export const ChevronDown = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const Close = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
);

export const MenuLines = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Icon>
);

/** The assistant's mark: one large and two small four-point sparkles. */
export const Sparkles = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10 4.5c.5 3.6 1.9 5 5.5 5.5-3.6.5-5 1.9-5.5 5.5-.5-3.6-1.9-5-5.5-5.5 3.6-.5 5-1.9 5.5-5.5Z" />
    <path d="M18 3v3M16.5 4.5h3M18 15.5v4M16 17.5h4" />
  </Icon>
);

export const Send = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 12 20 4.5 15.5 20l-3.5-6.5L4.5 12ZM12 13.5l8-9" />
  </Icon>
);

export const Globe = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5Z" />
  </Icon>
);

export const Laptop = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="5" width="14" height="10" rx="1.5" />
    <path d="M3 18.5h18l-1.2-2H4.2Z" />
  </Icon>
);

export const Search = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.4-4.4" />
  </Icon>
);

export const Phone = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />
  </Icon>
);

export const Message = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 7.4 7.4 0 0 1-3.5-.9L4 20l1.4-4.4a7.5 7.5 0 1 1 14.6-4.1Z" />
    <path d="M9 11.5h.01M12.5 11.5h.01M16 11.5h.01" />
  </Icon>
);

export const Mail = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </Icon>
);

export const Form = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="3.5" width="14" height="17" rx="2" />
    <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
  </Icon>
);

export const Building = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 20h16M6 20V6l6-2.5L18 6v14M9.5 9h1M13.5 9h1M9.5 12.5h1M13.5 12.5h1M10.5 20v-3.5h3V20" />
  </Icon>
);

export const Shield = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3.5 19 6v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6l7-2.5Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Icon>
);

export const Lock = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.5v2" />
  </Icon>
);

export const Document = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 3.5h7l4 4v13H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" />
    <path d="M14 3.5v4h4M9 12h6M9 15.5h6" />
  </Icon>
);

export const Calendar = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4" y="5.5" width="16" height="15" rx="2" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </Icon>
);

/* Social networks: each platform's mark simplified to the same outline
   style, so they sit together as one set in the footer. */

export const Facebook = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14.5 21v-7.5H17l.5-3h-3V8.8c0-.9.4-1.5 1.6-1.5h1.5V4.6a19 19 0 0 0-2.3-.1c-2.3 0-3.8 1.4-3.8 4v2h-2.5v3H11V21" />
  </Icon>
);

export const LinkedIn = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M8 10.5V16.5M8 7.6v.1M11.5 16.5v-6M11.5 13c0-1.6 1-2.6 2.4-2.6s2.1 1 2.1 2.6v3.5" />
  </Icon>
);

export const Instagram = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.8" />
    <path d="M16.9 7.1v.1" />
  </Icon>
);

export const XLogo = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 4h4.2l10.8 16h-4.2zM19.2 4l-5.9 6.9M10.7 13.1 4.8 20" />
  </Icon>
);

export const YouTube = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
    <path d="m10 9.2 5 2.8-5 2.8z" />
  </Icon>
);

export const TikTok = (props: IconProps) => (
  <Icon {...props}>
    <path d="M13.5 3.5v11.8a3.3 3.3 0 1 1-3.3-3.3M13.5 3.5c.4 2.6 2.2 4.4 5 4.6" />
  </Icon>
);
