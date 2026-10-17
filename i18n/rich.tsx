import type { ReactNode } from "react";

// Only these markers are rendered (Delta APP_FLOW section 11); anything else stays literal text
// (no HTML injection). <em> is the one accent word of a heading, <s> is struck-through text.
const TAG_PATTERN = /<(em|s|strong)>(.*?)<\/\1>/g;

function renderTag(tag: string, content: string, key: number): ReactNode {
  switch (tag) {
    case "em":
      return (
        <em key={key} className="ac">
          {content}
        </em>
      );
    case "s":
      return <s key={key}>{content}</s>;
    default:
      return (
        <strong key={key} className="font-medium text-text">
          {content}
        </strong>
      );
  }
}

export function richText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  for (const match of text.matchAll(TAG_PATTERN)) {
    const [whole, tag, content] = match;
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    nodes.push(renderTag(tag, content, key++));
    cursor = match.index + whole.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}
