// The emblem image library. Every image dropped into web/emblems/ is discovered
// at build time, hashed by Vite, and offered in the picker. Sub-folders become
// categories; loose files sit under "General".

import { escapeHtml } from "./format.ts";
import { icon } from "./icons.ts";

const urls = import.meta.glob("./emblems/**/*.{png,jpg,jpeg,svg,webp,PNG,JPG,JPEG,SVG}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export interface LibraryIcon {
  /** Stable id: the path relative to web/emblems, e.g. "vg/WF/foo.png". */
  id: string;
  /** Hashed, build-safe URL to the asset. */
  url: string;
  category: string;
  label: string;
}

function titleCase(s: string): string {
  return s.replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim();
}

export const ICON_LIBRARY: LibraryIcon[] = Object.entries(urls)
  .map(([path, url]) => {
    const rel = path.replace(/^\.\/emblems\//, "");
    const parts = rel.split("/");
    const category = parts.length > 1 ? parts[0] : "General";
    const file = parts[parts.length - 1];
    return { id: rel, url, category, label: titleCase(file.replace(/\.[^.]+$/, "")) };
  })
  .sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));

const BY_ID = new Map(ICON_LIBRARY.map((i) => [i.id, i]));

/** Resolve a stored library id to its current hashed URL, or undefined. */
export function libraryUrl(id: string | undefined): string | undefined {
  return id ? BY_ID.get(id)?.url : undefined;
}

export const ICON_CATEGORIES: string[] = [...new Set(ICON_LIBRARY.map((i) => i.category))].sort((a, b) =>
  a === "abs" ? -1 : b === "abs" ? 1 : a === "General" ? -1 : b === "General" ? 1 : a.localeCompare(b),
);

// Folder names are terse; show a readable label in the picker. Unmapped folders
// are title-cased.
const CATEGORY_LABELS: Record<string, string> = {
  abs: "Fleet Marks",
  vg: "Insignia",
  human: "Human Sphere",
  corpo: "Corporate",
  authoritarian: "Authoritarian",
};
function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** A random library icon id (Math.random is fine in app code). */
export function randomIconId(): string | undefined {
  if (ICON_LIBRARY.length === 0) return undefined;
  return ICON_LIBRARY[Math.floor(Math.random() * ICON_LIBRARY.length)]!.id;
}

/**
 * Shared markup for the icon-library controls: a Random button and a
 * categorised picker. Action names are passed so fleets, outfits, and custom
 * factions can reuse it.
 */
/** Just the categorised icon grids (no wrapper/controls), for embedding. */
export function iconLibraryGrid(actLib: string, currentLib?: string): string {
  return (
    ICON_CATEGORIES.map((cat) => {
      const inCat = ICON_LIBRARY.filter((i) => i.category === cat);
      const items = inCat
        .map(
          (i) =>
            `<button class="lib-icon ${currentLib === i.id ? "selected" : ""}" data-action="${actLib}" data-lib="${escapeHtml(i.id)}" title="${escapeHtml(i.label)}"><img loading="lazy" src="${i.url}" alt="${escapeHtml(i.label)}" /></button>`,
        )
        .join("");
      return `<div class="lib-cat"><h5 class="lib-cat-title">${escapeHtml(categoryLabel(cat))} <span class="muted">${inCat.length}</span></h5><div class="lib-grid">${items}</div></div>`;
    }).join("") || '<p class="muted">No icons in the library yet.</p>'
  );
}

export function iconLibraryControls(actLib: string, actRandom: string, currentLib?: string): string {
  const cats = iconLibraryGrid(actLib, currentLib);
  return `
    <button class="emblem-choice" data-action="${actRandom}" title="Random icon from the library">${icon("shuffle", 18)}</button>
    <details class="icon-library">
      <summary class="emblem-choice lib-open" title="Choose from the icon library">${icon("grid", 18)}</summary>
      <div class="lib-body">${cats || '<p class="muted">No icons in the library yet.</p>'}</div>
    </details>`;
}
