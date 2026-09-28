import type { ReactNode } from "react";

// Only these markers are rendered; anything else stays literal text (no HTML injection).
const TAG_PATTERN = /<(hl|dim|mark|strong)>(.*?)<\/\1>/g;

function renderTag(tag: string, content: string, key: number): ReactNode {
  switch (tag) {
    case "hl":
      return (
        <span key={key} className="hl">
          {content}
        </span>
      );
    case "dim":
      return (
        <span key={key} className="dim">
          {content}
        </span>
      );
    case "mark":
      return <mark key={key}>{content}</mark>;
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
