/**
 * Minimal builder for Lexical rich-text documents (the format Payload's
 * editor stores), so seeded copy is editable in the CMS like any other.
 */
type TextNode = {
  type: "text";
  text: string;
  format: 0;
  detail: 0;
  mode: "normal";
  style: "";
  version: 1;
};

type BlockNode = {
  type: "paragraph" | "heading";
  tag?: "h2" | "h3";
  children: TextNode[];
  direction: "ltr";
  format: "";
  indent: 0;
  version: 1;
  textFormat?: 0;
};

export type LexicalDocument = {
  root: {
    type: "root";
    children: BlockNode[];
    direction: "ltr";
    format: "";
    indent: 0;
    version: 1;
  };
};

const text = (value: string): TextNode => ({
  type: "text",
  text: value,
  format: 0,
  detail: 0,
  mode: "normal",
  style: "",
  version: 1,
});

export const paragraph = (value: string): BlockNode => ({
  type: "paragraph",
  children: [text(value)],
  direction: "ltr",
  format: "",
  indent: 0,
  version: 1,
  textFormat: 0,
});

export const heading = (value: string, tag: "h2" | "h3" = "h2"): BlockNode => ({
  type: "heading",
  tag,
  children: [text(value)],
  direction: "ltr",
  format: "",
  indent: 0,
  version: 1,
});

export function richText(...nodes: (BlockNode | string)[]): LexicalDocument {
  return {
    root: {
      type: "root",
      children: nodes.map((node) => (typeof node === "string" ? paragraph(node) : node)),
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  };
}
