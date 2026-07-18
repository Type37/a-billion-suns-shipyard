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

// Small WebP copies of the raster emblems, built by scripts/make-emblem-thumbs.py
// and keyed by the same relative path with a .webp extension. The originals are
// full-size artwork (1024px is typical, 2000px happens) and the picker draws
// them in a ~95px tile, so browsing the library used to pull megabytes of image
// data to render thumbnails. The grid uses these; the original is still what a
// chosen emblem renders from.
const thumbUrls = import.meta.glob("./emblem-thumbs/**/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

// Which raster marks have a real alpha channel, written by the thumbnail script.
// Tinting paints a colour through the mark's own transparency (a CSS mask), so
// it works on any cut-out image - it was gated to SVG only, which meant a
// labelled Tint row that did nothing for 247 of 253 marks. An opaque image would
// mask into a solid coloured rectangle, hence the check.
import tintableList from "./emblem-thumbs/tintable.json";

const TINTABLE = new Set<string>(tintableList as string[]);

const THUMB_BY_REL = new Map<string, string>(
  Object.entries(thumbUrls).map(([path, url]) => [path.replace(/^\.\/emblem-thumbs\//, "").replace(/\.webp$/i, ""), url]),
);

export interface LibraryIcon {
  /** Stable id: the path relative to web/emblems, e.g. "vg/WF/foo.png". */
  id: string;
  /** Hashed, build-safe URL to the asset. */
  url: string;
  /** Small copy for the picker grid. Falls back to `url` for vector marks. */
  thumb: string;
  category: string;
  label: string;
  /** Extra search terms describing what the mark depicts. */
  keywords: string[];
  /** True if a colour can be painted through this mark (it has transparency). */
  tintable: boolean;
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
  // An acronym running straight into a word ("PACLogo", "UNSCNavy") splits on
  // the last capital, which the rule above cannot see because both are upper.
  s = s.replace(/([A-Z]{2,})([A-Z][a-z])/g, "$1 $2");
  const out = titleCase(s);
  return out || titleCase(fileNoExt);
}

// Search keywords. The filenames are the names the ARTIST gave these marks
// ("Kaleidoblades", "Signum Bronze", "pfp (16)", "Cytclone"), which is almost
// never what someone types into the box. They search for what the mark DEPICTS -
// skull, eagle, wings, money - so the label alone makes most searches fail.
//
// Two layers. Every icon inherits its folder's keywords, and any icon whose
// filename matches a pattern below picks up that pattern's keywords too.
const FOLDER_KEYWORDS: Record<string, string[]> = {
  Patterns: ["pattern", "floral", "flower", "geometric", "kaleidoscope", "ornament", "decorative"],
  authoritarian: ["authority", "regime", "empire", "fascist", "state", "control", "order"],
  corpo: ["corporate", "company", "business", "brand", "megacorp", "industry"],
  faith: ["religion", "religious", "church", "cross", "holy", "sacred", "cult", "temple"],
  glitch: ["glitch", "hack", "cyber", "netrun", "digital", "corrupt", "static", "data"],
  gradient: ["gradient", "colour", "color", "abstract", "shape"],
  hexagons: ["hexagon", "hex", "geometric", "tech", "grid", "network"],
  history: ["history", "historical", "old", "vintage", "classic", "heritage"],
  lucre: ["money", "wealth", "rich", "credits", "cash", "profit", "finance", "business", "corporate", "greed"],
  military: ["military", "army", "navy", "war", "combat", "rank", "insignia", "service", "soldier", "unsc"],
  nonhuman: ["alien", "xeno", "nonhuman", "non-human", "creature", "covenant", "banished", "strange"],
  skull: ["skull", "death", "bone", "pirate", "danger", "dead", "skeleton", "poison"],
  steel: ["steel", "metal", "iron", "industrial", "rebel", "resistance", "armour", "armor"],
  General: [],
};

// Matched against the raw filename, so artist naming and franchise prefixes both
// work as hooks. Keep these about what the mark LOOKS like.
const KEYWORD_RULES: Array<[RegExp, string[]]> = [
  [/skull|ghoulie|jolly.?roger|nightmare|reaper|bone/i, ["skull", "death", "bone", "pirate"]],
  [/jolly.?roger|pirate|pmc|raider|corsair/i, ["pirate", "outlaw", "raider", "mercenary"]],
  [/phoenix|firebird/i, ["phoenix", "bird", "fire", "wings", "rebirth"]],
  [/griffin|dragon|unicorn|draco|fangs|beast|wolf|serpent/i, ["beast", "creature", "animal", "monster", "myth"]],
  [/eagle|falcon|hawk|raven|wing|winged|arrowfall|sabre/i, ["bird", "wings", "flight", "eagle", "raptor"]],
  [/star|stellar|solar|sol|astral|celestial|nova|empyrean/i, ["star", "space", "cosmic", "celestial", "sun"]],
  [/planet|world|earth|orbital|planetary|azimuth|cartograph/i, ["planet", "world", "orbit", "space", "globe"]],
  [/crown|crowned|king|royal|imperial|monarch/i, ["crown", "king", "royal", "monarch", "empire"]],
  [/cross|chapel|templar|illuminati|liturg|prelate/i, ["cross", "religion", "faith", "holy", "order"]],
  [/atom|atomic|radioactive|nuclear|hazard|toxic/i, ["atomic", "nuclear", "radiation", "hazard", "danger"]],
  [/hex|hexan|honeycomb|traxus/i, ["hexagon", "hex", "geometric", "tech"]],
  [/zap|bolt|volt|electric|lightning|thunder|storm/i, ["lightning", "bolt", "electric", "energy", "power"]],
  [/eye|oracle|watch|seer|vision|scan|search/i, ["eye", "watch", "vision", "surveillance", "see"]],
  [/anchor|navy|naval|fleet|navlogcom|unsc|marine/i, ["navy", "naval", "fleet", "anchor", "ship"]],
  [/shield|aegis|guard|protect|defen[cs]e|phalanx|bulwark/i, ["shield", "defence", "defense", "guard", "protection"]],
  [/sword|blade|kaleidoblade|spear|lance|axe|knife/i, ["sword", "blade", "weapon", "melee"]],
  [/gear|cog|machine|mech|industr|forge|factory|systems/i, ["gear", "machine", "industrial", "tech", "engineering"]],
  [/arrow|arrowdwn|vector|trivector|delta|point/i, ["arrow", "direction", "vector", "point"]],
  [/flower|floral|rose|clover|petal|bloom|awakening/i, ["flower", "floral", "plant", "nature", "bloom"]],
  [/butterfly|moth|insect|bee|bees|spider/i, ["insect", "bug", "butterfly", "nature"]],
  [/diamond|gem|crystal|prisma|jewel|opulent/i, ["diamond", "gem", "crystal", "jewel", "precious"]],
  [/gold|silver|bronze|platinum|onyx|signum|medal|rank/i, ["medal", "rank", "award", "metal", "insignia"]],
  [/business|lucre|money|credit|market|megamart|fund|bank/i, ["money", "business", "corporate", "wealth", "finance"]],
  [/infinity|loop|recursive|spiral|oscillation|manifold/i, ["infinity", "loop", "spiral", "abstract"]],
  [/citadel|fortress|castle|tower|keystone|foundation/i, ["fortress", "castle", "building", "structure", "stronghold"]],
  [/flame|fire|burn|ember|blaze|ashrisen/i, ["fire", "flame", "burn", "heat"]],
  [/ice|frost|snow|glacier|cryo/i, ["ice", "frost", "cold", "snow"]],
  [/covenant|banished|grineer|chosen|siqtar|zeta|otherworld/i, ["alien", "xeno", "nonhuman", "creature"]],
  [/union|alliance|coalition|assembl|guild|council/i, ["union", "alliance", "group", "collective", "organisation"]],
  [/chess|chesspiece|game|play|trailer/i, ["chess", "game", "strategy", "piece"]],
  [/recycle|arrows|renew|earth.?day|green/i, ["recycle", "renewal", "environment", "green", "cycle"]],
  [/net(run|work)|decipher|signal|query|data|algorithm|match/i, ["network", "data", "signal", "code", "computing"]],
  // Terms an audit found returning nothing at all.
  [/warship|frigate|cruiser|destroyer|dreadnought|battle|combat|assault/i, ["warship", "battle", "combat", "military", "fleet"]],
  [/rocket|missile|torpedo|launch|thrust|engine|propuls/i, ["rocket", "missile", "engine", "launch", "thrust"]],
  [/imperial|empire|imperium|throne|regal|sovereign|dominion/i, ["imperial", "empire", "throne", "authority", "rule"]],
  [/wolf|hound|fang|claw|predator|hunt/i, ["wolf", "predator", "hunter", "animal", "beast"]],
  [/mining|miner|drill|excav|quarry|extract|foundry|smelt/i, ["mining", "drill", "industry", "extraction", "labour"]],
  [/trade|merchant|cargo|freight|haul|market|commerce|logistic/i, ["trade", "cargo", "merchant", "shipping", "commerce"]],
];

/** Every keyword that should find this icon. */
function keywordsFor(file: string, category: string, label: string): string[] {
  const set = new Set<string>(FOLDER_KEYWORDS[category] ?? []);
  for (const [pattern, words] of KEYWORD_RULES) {
    if (pattern.test(file) || pattern.test(label)) for (const w of words) set.add(w);
  }
  return [...set];
}

export const ICON_LIBRARY: LibraryIcon[] = Object.entries(urls)
  .map(([path, url]) => {
    const rel = path.replace(/^\.\/emblems\//, "");
    const parts = rel.split("/");
    const category = parts.length > 1 ? (parts[0] ?? "General") : "General";
    const file = parts[parts.length - 1] ?? rel;
    const label = cleanLabel(file.replace(/\.[^.]+$/, ""));
    // SVGs have no thumbnail (and need none) - they fall back to the original.
    const thumb = THUMB_BY_REL.get(rel.replace(/\.[^.]+$/, "")) ?? url;
    // Vectors are always tintable; rasters only if they carry transparency.
    const tintable = /\.svg$/i.test(rel) || TINTABLE.has(rel.replace(/\.[^.]+$/, ""));
    return { id: rel, url, thumb, category, label, keywords: keywordsFor(file, category, label), tintable };
  })
  .sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));

// One lowercase haystack per icon, built once at module load rather than on
// every keystroke. Search re-runs on each character typed, and the grid is
// rebuilt wholesale each time, so this has to stay off the hot path.
const HAYSTACK = new Map<string, string>(
  ICON_LIBRARY.map((i) => [
    i.id,
    [i.label, categoryLabel(i.category), i.category, ...i.keywords].join(" ").toLowerCase(),
  ]),
);

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
    nonhuman: "Non-Human",
    glitch: "Glitch",
    steel: "Steel",
    faith: "Faith",
    gradient: "Gradient",
    hexagons: "Hexagons",
    Patterns: "Patterns",
    authoritarian: "Authoritarian",
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
/** Tiles rendered per page. Roughly three screens' worth at the modal's width. */
export const LIB_PAGE = 72;

/**
 * Does this mark match the query? Every word must match somewhere, so "red
 * skull" narrows rather than widens. A trailing "s" is also tried bare, because
 * "skulls" returning nothing while "skull" returns eleven reads as broken.
 */
function matchesQuery(i: LibraryIcon, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const hay = HAYSTACK.get(i.id) ?? "";
  return terms.every((t) => hay.includes(t) || (t.length > 3 && t.endsWith("s") && hay.includes(t.slice(0, -1))));
}

/** Split a raw query into search terms. */
export function queryTerms(query?: string): string[] {
  const q = (query ?? "").trim().toLowerCase();
  return q ? q.split(/\s+/) : [];
}

/** Marks matching a query, ignoring the folder filter. Used for folder counts. */
export function matchCount(query: string | undefined, category?: string): number {
  const terms = queryTerms(query);
  return ICON_LIBRARY.filter((i) => (!category || i.category === category) && matchesQuery(i, terms)).length;
}

export function iconLibraryGrid(
  actLib: string,
  currentLib?: string,
  activeCat?: string,
  query?: string,
  shown: number = LIB_PAGE,
): string {
  const q = (query ?? "").trim().toLowerCase();
  const terms = queryTerms(query);
  const matches = ICON_LIBRARY.filter(
    (i) => (!activeCat || activeCat === "all" || i.category === activeCat) && matchesQuery(i, terms),
  );
  // Only the first `shown` are built. The rest arrive as the sentinel below
  // scrolls into view (see main.ts), which keeps the modal instant to open and
  // keeps the images near enough to the viewport that lazy loading fetches them.
  const remaining = Math.max(0, matches.length - shown);
  // The first rows load eagerly. `loading="lazy"` only fetches what is near the
  // viewport, and the grid can legitimately open below the fold (a short window,
  // or the colour rows pushing it down), in which case nothing loads at all and
  // the picker shows an empty checkerboard until you scroll. These few are
  // cheap - a thumbnail averages about 5KB - and they guarantee the picker
  // always opens onto actual sigils.
  const EAGER = 24;
  const items = matches
    .slice(0, shown)
    .map(
      // The name is back as a title. It was dropped as "mouseover noise", but the
      // alternative turned out to be 253 anonymous pictures whose only name was a
      // raw asset filename in alt text, so a search hit set looked arbitrary.
      // Intrinsic width/height plus lazy/async decoding keep the grid from
      // reflowing as images arrive.
      (i, n) =>
        `<button class="lib-icon ${currentLib === i.id ? "selected" : ""}" data-cat="${escapeHtml(i.category)}" data-action="${actLib}" data-lib="${escapeHtml(i.id)}" title="${escapeHtml(i.label)}" aria-pressed="${currentLib === i.id}" aria-label="${escapeHtml(i.label)}"><img loading="${n < EAGER ? "eager" : "lazy"}" decoding="async" width="64" height="64" src="${i.thumb}" alt="" /><span class="lib-icon-name">${escapeHtml(i.label)}</span></button>`,
    )
    .join("");
  if (!items) {
    // Never just "no match": the search is scoped to the open folder, and an
    // unqualified denial made a folder-scoped miss look like the library had
    // nothing. Say where it looked and how many there are elsewhere.
    if (!q) return `<p class="muted">No sigils in this folder.</p>`;
    const everywhere = matchCount(query);
    const folder = activeCat && activeCat !== "all" ? categoryLabel(activeCat) : "";
    return folder
      ? `<p class="muted">Nothing matching that in ${escapeHtml(folder)}.${
          everywhere ? ` <button class="linklike" data-action="emblem-lib-cat" data-cat="all">Search all ${everywhere} instead</button>` : ""
        }</p>`
      : `<p class="muted">No sigils match that search.</p>`;
  }
  // A real button, not a bare sentinel. The scroll observer in main.ts loads the
  // next page automatically when this comes into view, but an observer inside a
  // short modal scroller is not something to bet the feature on - and a button
  // says plainly that there is more, which a silent gap does not.
  const more = remaining
    ? `<button class="lib-more" data-lib-more data-action="emblem-lib-more">${icon("plus", 14)}<span class="lib-more-count">Show ${remaining} more</span></button>`
    : "";
  return `<div class="lib-grid lib-grid-blob">${items}</div>${more}`;
}



/** Look up a library icon by its stored id. */
export function libraryIcon(id: string | undefined): LibraryIcon | undefined {
  return id ? BY_ID.get(id) : undefined;
}
