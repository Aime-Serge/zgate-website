import type { Article, Course, Division, Page, SiteSetting } from "@zgate/cms-contracts";

export type Block = Page["layout"][number];

/** One block type's data, e.g. BlockOf<"hero">. */
export type BlockOf<T extends Block["blockType"]> = Extract<Block, { blockType: T }>;

/** What every section may draw on besides its own block data. */
export type BlockContext = {
  settings: SiteSetting;
  divisions: Division[];
  courses: Course[];
  /** The newest published articles (for "Latest"). */
  articles: Article[];
  privacyLive: boolean;
  /** Published solution pages (for "solutionGrid"). */
  solutions: Page[];
  contextualService?: Division["slug"];
  /** Who the site is for - shown under the hero headline (home page only). */
  audienceLine?: string | null;
};
