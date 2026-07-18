// The emblem image library. Every image dropped into web/emblems/ is discovered
// at build time, hashed by Vite, and offered in the picker. Sub-folders become
// categories; loose files sit under "General".

import { escapeHtml } from "./format.ts";

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

// Source filenames carry a lot of noise ("HINF_-_Emblem_icon_-_Phoenix.png",
// "Icon_Zap.png", "UI_Role_Anchor.png"). Strip the boilerplate so the label is
// the thing itself - which is what search matches on and what reads in the grid.
function cleanLabel(fileNoExt: string): string {
  let s = fileNoExt;
  // "HINF_-_Emblem_icon_-_Phoenix" and "HINF_Griffin_Emblem" are both Halo files.
  s = s.replace(/^HINF[\s_-]*-?[\s_-]*Emblem[\s_-]*icon[\s_-]*-?[\s_-]*/i, "");
  s = s.replace(/^HINF[\s_-]+/i, "");
  s = s.replace(/^UI[\s_-]+Role[\s_-]+/i, "");
  s = s.replace(/^(Icon|Emblem|Sigil|Logo)[\s_-]+/i, "");
  s = s.replace(/[\s_-]+(Recreated|Logo|Icon|Emblem)$/i, "");
  // Split camelCase into words ("FactionSigilBusiness" -> "Faction Sigil
  // Business"). Only on a lower/digit -> upper boundary, so ALLCAPS acronyms
  // (NAVLOGCOM, BHM, AAPIH) survive intact.
  s = s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  const out = titleCase(s);
  return out || titleCase(fileNoExt);
}

export const ICON_LIBRARY: LibraryIcon[] = Object.entries(urls)
  .map(([path, url]) => {
    const rel = path.replace(/^\.\/emblems\//, "");
    const parts = rel.split("/");
    const category = parts.length > 1 ? (parts[0] ?? "General") : "General";
    const file = parts[parts.length - 1] ?? rel;
    return { id: rel, url, category, label: cleanLabel(file.replace(/\.[^.]+$/, "")) };
  })
  .sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));

const BY_ID = new Map(ICON_LIBRARY.map((i) => [i.id, i]));

/** Resolve a stored library id to its current hashed URL, or undefined. */
export function libraryUrl(id: string | undefined): string | undefined {
  return id ? BY_ID.get(id)?.url : undefined;
}

/** A human label for a category folder (the folders are the emblem sub-folders). */
export function categoryLabel(cat: string): string {
  const overrides: Record<string, string> = {
    abs: "A Billion Suns",
    vg: "Video Games",
    General: "General",
    corpo: "Corporate",
    lucre: "Wealth",
  };
  if (overrides[cat]) return overrides[cat]!;
  // Title-case a plain folder name: "alien" -> "Alien", "authoritarian" -> "Authoritarian".
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

// Folders in reading order: named sub-folders alphabetically BY THEIR LABEL (so
// the chips read A-Z as displayed), then the loose-files "General" bucket last
// (it's the catch-all, not a real folder).
export const ICON_CATEGORIES: string[] = [...new Set(ICON_LIBRARY.map((i) => i.category))].sort((a, b) =>
  a === "General" ? 1 : b === "General" ? -1 : categoryLabel(a).localeCompare(categoryLabel(b)),
);

/** How many icons live in each category folder. */
export const ICON_COUNT_BY_CATEGORY: Record<string, number> = ICON_LIBRARY.reduce<Record<string, number>>((acc, i) => {
  acc[i.category] = (acc[i.category] ?? 0) + 1;
  return acc;
}, {});

/** A random library icon id (Math.random is fine in app code). */
export function randomIconId(): string | undefined {
  if (ICON_LIBRARY.length === 0) return undefined;
  return ICON_LIBRARY[Math.floor(Math.random() * ICON_LIBRARY.length)]!.id;
}

/** One flat, sorted grid of every icon (no category headers), for embedding.
 * Each tile carries its origin folder as data-cat so styling can treat sets
 * differently (e.g. keep the colour on the "vg" insignia). */
export function iconLibraryGrid(actLib: string, currentLib?: string, activeCat?: string, query?: string): string {
  const q = (query ?? "").trim().toLowerCase();
  const items = [...ICON_LIBRARY]
    .filter((i) => !activeCat || activeCat === "all" || i.category === activeCat)
    .filter((i) => !q || i.label.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(
      // No title tooltip - the mouseover label was noise. alt stays for a11y.
      (i) =>
        `<button class="lib-icon ${currentLib === i.id ? "selected" : ""}" data-cat="${escapeHtml(i.category)}" data-action="${actLib}" data-lib="${escapeHtml(i.id)}"><img loading="lazy" src="${i.url}" alt="${escapeHtml(i.label)}" /></button>`,
    )
    .join("");
  return items
    ? `<div class="lib-grid lib-grid-blob">${items}</div>`
    : `<p class="muted">${q ? "No sigils match that search." : "No icons in this folder."}</p>`;
}


