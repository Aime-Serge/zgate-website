/** What the assistant endpoint (src/app/api/assistant) answers with. */
export type AssistantReply = {
  reply: string;
  links: { title: string; href: string }[];
  mode: "ai" | "guided";
};
