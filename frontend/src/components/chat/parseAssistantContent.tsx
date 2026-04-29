import { Link } from "react-router-dom";
import { Fragment, ReactNode } from "react";

const MARKER =
  /\[(ATTRACTION|TOUR|BOOK_TOUR):(\d+):([^\]]*)\]/g;

type Part =
  | { type: "text"; value: string }
  | { type: "attraction"; id: number; name: string }
  | { type: "tour"; id: number; name: string }
  | { type: "book"; id: number; name: string };

function splitMarkers(text: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(MARKER.source, "g");
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ type: "text", value: text.slice(last, m.index) });
    }
    const kind = m[1];
    const id = parseInt(m[2], 10);
    const name = m[3] || "";
    if (kind === "ATTRACTION") {
      parts.push({ type: "attraction", id, name });
    } else if (kind === "TOUR") {
      parts.push({ type: "tour", id, name });
    } else {
      parts.push({ type: "book", id, name });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }
  return parts.length ? parts : [{ type: "text", value: text }];
}

/** Very small inline markdown: **bold**, `code`, newlines → <br /> */
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const boldRe = /\*\*([^*]+)\*\*/g;
  let idx = 0;
  let m: RegExpExecArray | null;
  while ((m = boldRe.exec(text)) !== null) {
    if (m.index > idx) {
      nodes.push(
        <Fragment key={`t-${idx}`}>
          {text.slice(idx, m.index).split("\n").map((line, i, arr) => (
            <Fragment key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </Fragment>
          ))}
        </Fragment>,
      );
    }
    nodes.push(
      <strong key={`b-${m.index}`} className="font-semibold">
        {m[1]}
      </strong>,
    );
    idx = m.index + m[0].length;
  }
  if (idx < text.length) {
    nodes.push(
      <Fragment key={`end-${idx}`}>
        {text.slice(idx).split("\n").map((line, i, arr) => (
          <Fragment key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </Fragment>
        ))}
      </Fragment>,
    );
  }
  return nodes.length ? nodes : [text];
}

/**
 * ATX headings (# …) rendered as styled titles without # characters;
 * paragraphs split by blank lines; **bold** via renderInline.
 */
function renderTextAsBlocks(text: string): ReactNode[] {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (para.length === 0) return;
    const chunk = para.join("\n").trimEnd();
    para = [];
    if (!chunk) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="mb-2 block last:mb-0">
        {renderInline(chunk)}
      </p>,
    );
  };

  for (const line of lines) {
    const hm = line.match(/^(#{1,6})\s+(.*)$/);
    if (hm) {
      flushPara();
      const level = hm[1].length;
      const raw = hm[2].trim();
      if (!raw) continue;
      const cls =
        level === 1
          ? "mb-1.5 mt-3 block text-base font-bold text-gray-900 first:mt-0"
          : level === 2
            ? "mb-1 mt-2.5 block text-sm font-semibold text-gray-900 first:mt-0"
            : "mb-0.5 mt-2 block text-sm font-semibold text-gray-800 first:mt-0";
      blocks.push(
        <div
          key={`h-${blocks.length}`}
          className={cls}
          role="heading"
          aria-level={Math.min(level, 6)}
        >
          {renderInline(raw)}
        </div>,
      );
    } else if (line.trim() === "") {
      flushPara();
    } else {
      para.push(line);
    }
  }
  flushPara();
  return blocks.length > 0 ? blocks : [<span key="e">{renderInline(text)}</span>];
}

export function AssistantMessageContent({ content }: { content: string }) {
  const parts = splitMarkers(content);
  return (
    <div className="text-sm text-gray-800 leading-relaxed space-y-2">
      {parts.map((p, i) => {
        if (p.type === "text") {
          return (
            <div key={i} className="space-y-1">
              {renderTextAsBlocks(p.value)}
            </div>
          );
        }
        if (p.type === "attraction") {
          return (
            <Link
              key={i}
              to={`/attractions/${p.id}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-sky-50 text-sky-800 text-xs font-medium border border-sky-200 hover:bg-sky-100 my-0.5"
            >
              📍 {p.name || `Attraction #${p.id}`}
            </Link>
          );
        }
        if (p.type === "tour") {
          return (
            <Link
              key={i}
              to={`/tours/${p.id}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-900 text-xs font-medium border border-amber-200 hover:bg-amber-100 my-0.5"
            >
              🚌 {p.name || `Tour #${p.id}`}
            </Link>
          );
        }
        return (
          <Link
            key={i}
            to={`/bookings/new?tour=${p.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-semibold shadow-sm hover:bg-primary-600 my-1"
          >
            Book: {p.name || `Tour #${p.id}`}
          </Link>
        );
      })}
    </div>
  );
}
