// Minimal, dependency-free markdown renderer for assistant messages.
// Supports: headings, bold/italic/code, lists, blockquotes, paragraphs.
import { Fragment } from "react";

function renderInline(text: string) {
  // escape angle brackets
  const safe = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // code, bold, italic, links
  const html = safe
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-secondary text-[12px]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|\s)_([^_]+)_/g, '$1<em class="text-muted-foreground">$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a class="text-primary underline" href="$2" target="_blank" rel="noreferrer">$1</a>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const out: React.ReactNode[] = [];
  let list: string[] | null = null;
  const flushList = () => {
    if (list) {
      out.push(
        <ul key={out.length} className="my-2 pl-5 list-disc space-y-1">
          {list.map((l, i) => (
            <li key={i}>{renderInline(l)}</li>
          ))}
        </ul>,
      );
      list = null;
    }
  };
  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (/^\s*[-*]\s+/.test(line)) {
      list = list ?? [];
      list.push(line.replace(/^\s*[-*]\s+/, ""));
      return;
    }
    flushList();
    if (!line.trim()) return;
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const cls =
        level === 1
          ? "text-base font-semibold mt-3 mb-1"
          : level === 2
          ? "text-sm font-semibold mt-3 mb-1"
          : "text-xs uppercase tracking-wider text-muted-foreground mt-3 mb-1";
      out.push(
        <div key={idx} className={cls}>
          {renderInline(h[2])}
        </div>,
      );
      return;
    }
    if (line.startsWith("> ")) {
      out.push(
        <blockquote key={idx} className="my-2 border-l-2 border-border pl-3 text-muted-foreground">
          {renderInline(line.slice(2))}
        </blockquote>,
      );
      return;
    }
    out.push(
      <p key={idx} className="my-1.5 leading-relaxed">
        {renderInline(line)}
      </p>,
    );
  });
  flushList();
  return <Fragment>{out}</Fragment>;
}