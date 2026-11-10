import {
  createElement,
  Fragment,
  type ReactNode,
} from "react";
import { CodeBlock } from "../CodeBlock";

const INLINE_PATTERN =
  /(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\[[^\]\n]+\]\([^)\s]+\)|\*[^*\n]+\*)/g;

const BLOCK_START =
  /^(#{1,6}\s|```|~~~|>\s?|[-*+]\s+|\d+\.\s+|-{3,}$|\*{3,}$|_{3,}$)/;

function safeHref(raw: string): string | undefined {
  const value = raw.trim();
  if (value.length === 0) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^mailto:/i.test(value) || /^tel:/i.test(value)) return value;
  if (/^(\/|\.\/|\.\.\/|#|\?)/.test(value)) return value;
  return undefined;
}

function renderToken(token: string, key: string): ReactNode {
  if (token.startsWith("`")) {
    return (
      <code className="wk-assistant__inline-code" key={key}>
        {token.slice(1, -1)}
      </code>
    );
  }

  if (token.startsWith("**") || token.startsWith("__")) {
    return <strong key={key}>{token.slice(2, -2)}</strong>;
  }

  if (token.startsWith("~~")) {
    return <del key={key}>{token.slice(2, -2)}</del>;
  }

  if (token.startsWith("[")) {
    const match = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
    if (!match) return token;
    const label = match[1];
    const href = safeHref(match[2]);
    if (!href) return <span key={key}>{label}</span>;
    const external = /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        key={key}
        rel={external ? "noreferrer noopener" : undefined}
        target={external ? "_blank" : undefined}
      >
        {label}
      </a>
    );
  }

  return <em key={key}>{token.slice(1, -1)}</em>;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let index = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));
    nodes.push(renderToken(token, `${keyPrefix}-${index}`));
    lastIndex = start + token.length;
    index += 1;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function renderList(
  lines: readonly string[],
  ordered: boolean,
  key: string,
): ReactNode {
  const items = lines.map((line, index) => {
    const content = ordered
      ? line.replace(/^\d+\.\s+/, "")
      : line.replace(/^[-*+]\s+/, "");
    return (
      <li key={`${key}-item-${index}`}>
        {renderInline(content, `${key}-item-${index}`)}
      </li>
    );
  });

  if (ordered) {
    const start = Number.parseInt(lines[0], 10) || 1;
    return (
      <ol key={key} start={start === 1 ? undefined : start}>
        {items}
      </ol>
    );
  }

  return <ul key={key}>{items}</ul>;
}

function renderBlocks(text: string, keyPrefix: string): ReactNode[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  let blockIndex = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (line.trim().length === 0) {
      index += 1;
      continue;
    }

    const fence = /^(```|~~~)([\w-]*)\s*$/.exec(line);
    if (fence) {
      const marker = fence[1];
      const language = fence[2];
      const content: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith(marker)) {
        content.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <CodeBlock
          code={content.join("\n")}
          key={`${keyPrefix}-block-${blockIndex}`}
          language={language || undefined}
        />,
      );
      blockIndex += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      blocks.push(
        createElement(
          `h${level}`,
          { key: `${keyPrefix}-block-${blockIndex}` },
          renderInline(heading[2], `${keyPrefix}-heading-${blockIndex}`),
        ),
      );
      index += 1;
      blockIndex += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push(
        <hr key={`${keyPrefix}-block-${blockIndex}`} />,
      );
      index += 1;
      blockIndex += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote key={`${keyPrefix}-block-${blockIndex}`}>
          {renderBlocks(quote.join("\n"), `${keyPrefix}-quote-${blockIndex}`)}
        </blockquote>,
      );
      blockIndex += 1;
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*+]\s+/.test(lines[index])) {
        items.push(lines[index]);
        index += 1;
      }
      blocks.push(
        renderList(
          items,
          false,
          `${keyPrefix}-block-${blockIndex}`,
        ),
      );
      blockIndex += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index]);
        index += 1;
      }
      blocks.push(
        renderList(
          items,
          true,
          `${keyPrefix}-block-${blockIndex}`,
        ),
      );
      blockIndex += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim().length > 0 &&
      !(paragraph.length > 0 && BLOCK_START.test(lines[index]))
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    const content = paragraph.join("\n");
    blocks.push(
      <p key={`${keyPrefix}-block-${blockIndex}`}>
        {renderInline(content, `${keyPrefix}-paragraph-${blockIndex}`)}
      </p>,
    );
    blockIndex += 1;
  }

  return blocks;
}

export function Markdown({ text }: { text: string }) {
  return (
    <Fragment>
      {renderBlocks(text, "markdown")}
    </Fragment>
  );
}
