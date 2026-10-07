export type HtmlInline = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

export type HtmlBlock =
  | {type: 'paragraph'; inlines: HtmlInline[]}
  | {type: 'heading'; level: number; inlines: HtmlInline[]}
  | {type: 'list'; ordered: boolean; items: HtmlInline[][]};

export function prepareContent(raw: unknown): {
  isHtml: boolean;
  text: string;
  blocks: HtmlBlock[];
};
