// A small Markdown layer for the freeform notes fields (a faction's backstory).
// Markdown, not a contenteditable WYSIWYG, on purpose: the app full-re-renders
// through morphdom on every state change, which would clobber any editor that
// owns its own DOM, and a contenteditable toolbar has to fight for the selection
// on every click. A <textarea> is the uncontrolled pattern the app already uses
// for names, so it just works - and Markdown is how most notes/dev tools let you
// format without a heavy editor. The rendered output shows where the fleet is
// used (the builder, the picker), so what you type is formatted where it counts.

import { escapeHtml } from "./format.ts";

// Inline spans: bold, italic, code, links. Run on already-escaped text, so the
// only "<" and ">" in the string are the ones these produce.
function inline(s: string): string {
  return (
    s
      // [label](http…) - links only to http(s), opened safely.
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label: string, url: string) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
      .replace(/_([^_\n]+)_/g, "<em>$1</em>")
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
  );
}

/**
 * Render a Markdown string to safe HTML. HTML is escaped first, so nothing the
 * user types can inject markup; only the tags this function emits get through.
 * Supports: # / ## / ### headings, **bold**, *italic* / _italic_, `code`,
 * - and 1. lists, [links](http…), blank-line paragraphs and single-line breaks.
 */
export function renderMarkdown(src: string): string {
  const text = (src ?? "").replace(/\r\n?/g, "\n").trim();
  if (!text) return "";
  const lines = escapeHtml(text).split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join("<br>"))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.type}>`);
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const ordered = /^\d+\.\s+(.*)$/.exec(line);
    if (line.trim() === "") {
      flushPara();
      flushList();
    } else if (heading) {
      flushPara();
      flushList();
      const level = heading[1]!.length + 2; // # -> h3, ## -> h4, ### -> h5
      out.push(`<h${level} class="rt-h">${inline(heading[2]!)}</h${level}>`);
    } else if (bullet) {
      flushPara();
      if (list?.type !== "ul") flushList();
      list ??= { type: "ul", items: [] };
      list.items.push(bullet[1]!);
    } else if (ordered) {
      flushPara();
      if (list?.type !== "ol") flushList();
      list ??= { type: "ol", items: [] };
      list.items.push(ordered[1]!);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out.join("");
}

// One toolbar button. data-md carries the wrap kind; the md-wrap action reads it
// and edits the sibling textarea's selection.
function tbBtn(kind: string, label: string, glyph: string): string {
  return `<button type="button" class="rt-btn" data-action="md-wrap" data-md="${kind}" title="${label}" aria-label="${label}">${glyph}</button>`;
}

/**
 * A Markdown notes editor: a formatting toolbar, the textarea (committed on blur
 * by the given action/field), and a live preview that main.ts wires to keep in
 * step as you type. Content is Markdown text, stored as-is.
 */
export function markdownEditor(value: string, action: string, field: string): string {
  return `
  <div class="rt-editor">
    <div class="rt-toolbar" role="toolbar" aria-label="Formatting">
      ${tbBtn("bold", "Bold", "<b>B</b>")}
      ${tbBtn("italic", "Italic", "<i>I</i>")}
      ${tbBtn("h", "Heading", "H")}
      ${tbBtn("ul", "Bullet list", "&bull;")}
      ${tbBtn("ol", "Numbered list", "1.")}
      ${tbBtn("link", "Link", "&#128279;")}
    </div>
    <textarea class="rt-input" rows="5" placeholder="Lore, tactics, origin. **bold**, *italic*, # headings, - lists, [links](https://…)." data-action="${action}" data-field="${field}" data-rt="1">${escapeHtml(value)}</textarea>
    <div class="rt-preview" data-rt-preview aria-hidden="true">${renderMarkdown(value)}</div>
  </div>`;
}
