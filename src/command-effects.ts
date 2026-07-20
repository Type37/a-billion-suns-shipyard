// Working out what a fleet's rules actually DO to its commands.
//
// Faction rules, HVP and personnel routinely grant extra commands, discount core
// ones, or change how a core one resolves. Until now the sheet just said "your
// faction rule can grant more commands or change their cost - go read it", which
// pushes the lookup onto the player at the table. That is the one moment they
// have least patience for it. We know the rule text; we can read it for them.
//
// The published wording is highly regular, so this parses rather than hard-codes
// a table - a new faction written in house style is understood with no code
// change. Anything that does NOT match a known shape is deliberately left alone
// rather than guessed at: a wrong command on the sheet is far worse than a
// missing one, since the player has no reason to doubt it.

import { CORE_COMMANDS } from "./data/commands.ts";

/** A command granted by a rule, on top of the core list. */
export interface GrantedCommand {
  name: string;
  cost: number;
  text: string;
  /** The rule that granted it, e.g. "Sound Investments" or "Seasoned Captain". */
  source: string;
}

/** A core command whose cost a rule has changed. */
export interface CommandCostChange {
  /** Exact name of the core command affected. */
  command: string;
  cost: number;
  /** Usage cap wording, e.g. "once per Round", if the rule imposes one. */
  limit?: string;
  /** Who it applies to, e.g. "Mass 0 units", if the rule narrows it. */
  scope?: string;
  source: string;
}

/** A core command a rule modifies without changing its cost. */
export interface CommandNote {
  command: string;
  text: string;
  source: string;
}

/** A rule that applies to commands generally, rather than to one by name. */
export interface GlobalCommandNote {
  text: string;
  source: string;
}

export interface CommandEffects {
  granted: GrantedCommand[];
  costChanges: CommandCostChange[];
  notes: CommandNote[];
  /** Applies to every command, so it belongs above the list, not inside it. */
  global: GlobalCommandNote[];
}

/** A rule to read: its name (shown as the source) and its body text. */
export interface RuleSource {
  name: string;
  text: string;
}

const CORE_NAMES = CORE_COMMANDS.map((c) => c.name);

/** Strip the quotes the source text sometimes puts around command names. */
function unquote(s: string): string {
  return s.replace(/^['"‘’“”]+|['"‘’“”]+$/g, "").trim();
}

/** Match a fragment to a core command name, case/quote insensitively. */
function coreCommand(raw: string): string | undefined {
  const want = unquote(raw).toLowerCase();
  return CORE_NAMES.find((n) => n.toLowerCase() === want);
}

// "gains access to the following command: Surprise Audit (2 CMD): Select one..."
// Also covers "has access to", "have access to", "gains the command",
// "Also gains:", "gain:" - every introduction used in the published factions.
const GRANT_INTRO =
  /(?:gains?|have|has)\s+(?:access\s+to\s+)?the\s+following\s+[Cc]ommands?:\s*|gains?\s+the\s+command\s+|(?:Also\s+)?gains?:\s*|gain:\s*/g;

/**
 * Pull "Name (N CMD): body" out of the text following a grant introduction. The
 * body runs to the end of the rule - these are always written last, because the
 * granted command's text is itself a paragraph.
 */
function readGrant(after: string, source: string): GrantedCommand | undefined {
  const m = /^\s*([^:(]{2,60}?)\s*\((\d+)\s*CMD\)\s*:\s*([\s\S]+)$/.exec(after);
  if (!m) return undefined;
  const name = unquote(m[1]!);
  // A grant has to name something new. If the "name" is really a core command,
  // this is a cost change or a note dressed up as a grant, and belongs elsewhere.
  if (coreCommand(name)) return undefined;
  return { name, cost: Number(m[2]), text: m[3]!.trim(), source };
}

/**
 * A rule that IS a command, with no name of its own - the Ordinate's rule opens
 * straight into "(1 CMD): At the start of any player's...". The rule's own name
 * is the command's name.
 */
function readSelfGrant(text: string, source: string): GrantedCommand | undefined {
  const m = /^\s*\((\d+)\s*CMD\)\s*:\s*([\s\S]+)$/.exec(text);
  return m ? { name: source, cost: Number(m[1]), text: m[2]!.trim(), source } : undefined;
}

// "can use the Power to Engines command for 0 CMD once per Round"
// "can take the Red Alert command for 0 CMD Tokens"
// The leading clause tells us the scope ("Mass 0 units in this fleet").
const COST_USE =
  /([^.]*?)\bcan\s+(?:use|take)\s+the\s+(['"‘“]?[\w\s]+?['"’”]?)\s+command\s+for\s+(\d+)\s*CMD(?:\s*[Tt]okens?)?\s*(once\s+per\s+\w+)?/g;

// "reduces the cost of the 'Power to Weapons' and 'Power to Shields' commands to
// 0 CMD tokens" - one clause, any number of commands.
const COST_REDUCE = /reduces\s+the\s+cost\s+of\s+the\s+(.+?)\s+commands?\s+to\s+(\d+)\s*CMD/g;

/**
 * Trim a scope clause down to who it applies to. The captured run-up is whatever
 * preceded "can use", which may be a sentence boundary's worth of other rule.
 */
function readScope(raw: string): string | undefined {
  const s = raw.replace(/^[\s\S]*?[.;]\s*/, "").trim();
  // No length cap. There used to be one - anything over 60 characters was
  // dropped - which silently deleted a qualifier from a published rule and
  // printed the rest as though it applied unconditionally. A long clause is
  // still the rule; length is not a correctness signal.
  if (!s) return undefined;
  // "Each unit in this fleet" / "Ships in this fleet" carry no information -
  // that is just "your fleet", which the reader already knows.
  if (/^(each\s+unit|units?|ships?)\s+in\s+this\s+fleet$/i.test(s)) return undefined;
  return s;
}

// A rule that changes how a core command resolves, or keys off it having been
// used, without touching its cost. Both readings matter to a player scanning the
// command list: "this resolves differently" and "this is a trigger for me".
const NOTE_PATTERNS: RegExp[] = [
  // "...when they use the Red Alert command..." / "...use the Power to Weapons command..."
  /[^.]*\buse\s+the\s+(['"‘“]?[\w\s]+?['"’”]?)\s+command\b[^.]*\./g,
  // "...that has been given the 'Red Alert' command this round..."
  /[^.]*\bgiven\s+the\s+(['"‘“]?[\w\s]+?['"’”]?)\s+command\b[^.]*\./g,
];

// Rules that speak about commands as a class - "when you use a command",
// "double the CMD token costs of their commands". These cannot be filed under
// any single command, so they are surfaced once, above the whole list.
const GLOBAL_PATTERNS: RegExp[] = [
  /[^.]*\buse\s+a\s+command\b[^.]*\./g,
  /[^.]*\bcosts?\s+of\s+(?:their|all|any)\s+commands\b[^.]*\./g,
];

/** Read one rule for everything it does to the command list. */
function readRule(rule: RuleSource, out: CommandEffects): void {
  const text = rule.text ?? "";
  if (!text) return;

  const self = readSelfGrant(text, rule.name);
  if (self) out.granted.push(self);

  GRANT_INTRO.lastIndex = 0;
  for (let m = GRANT_INTRO.exec(text); m; m = GRANT_INTRO.exec(text)) {
    const g = readGrant(text.slice(m.index + m[0].length), rule.name);
    if (g && !out.granted.some((x) => x.name === g.name)) out.granted.push(g);
  }

  COST_USE.lastIndex = 0;
  for (let m = COST_USE.exec(text); m; m = COST_USE.exec(text)) {
    const cmd = coreCommand(m[2]!);
    if (!cmd) continue;
    const scope = readScope(m[1] ?? "");
    out.costChanges.push({
      command: cmd,
      cost: Number(m[3]),
      ...(m[4] ? { limit: m[4].trim() } : {}),
      ...(scope ? { scope } : {}),
      source: rule.name,
    });
  }

  COST_REDUCE.lastIndex = 0;
  for (let m = COST_REDUCE.exec(text); m; m = COST_REDUCE.exec(text)) {
    const cost = Number(m[2]);
    // "'Power to Weapons' and 'Power to Shields'" -> both, separately.
    for (const part of m[1]!.split(/\s+and\s+|,\s*/)) {
      const cmd = coreCommand(part);
      if (cmd) out.costChanges.push({ command: cmd, cost, source: rule.name });
    }
  }

  for (const pat of NOTE_PATTERNS) {
    pat.lastIndex = 0;
    for (let m = pat.exec(text); m; m = pat.exec(text)) {
      const cmd = coreCommand(m[1]!);
      if (!cmd) continue;
      const sentence = m[0].trim();
      // If this same sentence already produced a cost change, it is not a note.
      if (/\bfor\s+\d+\s*CMD/i.test(sentence)) continue;
      if (!out.notes.some((n) => n.command === cmd && n.source === rule.name))
        out.notes.push({ command: cmd, text: sentence, source: rule.name });
    }
  }

  for (const pat of GLOBAL_PATTERNS) {
    pat.lastIndex = 0;
    for (let m = pat.exec(text); m; m = pat.exec(text)) {
      const sentence = m[0].trim();
      if (!out.global.some((n) => n.source === rule.name && n.text === sentence))
        out.global.push({ text: sentence, source: rule.name });
    }
  }
}

/**
 * Read every rule in play and report what it does to the command list. Pass the
 * faction rule, each carried HVP's rule, and any personnel rules.
 */
export function deriveCommandEffects(rules: RuleSource[]): CommandEffects {
  const out: CommandEffects = { granted: [], costChanges: [], notes: [], global: [] };
  for (const r of rules) readRule(r, out);
  return out;
}

/** The effective cost of a core command, given the changes in play. */
export function effectiveCost(
  command: string,
  baseCost: number,
  changes: CommandCostChange[],
): { cost: number; change?: CommandCostChange } {
  // Cheapest wins; a rule only ever discounts in the published text, and if two
  // ever applied at once the player would take the better one.
  const applies = changes.filter((c) => c.command === command);
  if (applies.length === 0) return { cost: baseCost };
  const best = applies.reduce((a, b) => (b.cost < a.cost ? b : a));
  return best.cost < baseCost ? { cost: best.cost, change: best } : { cost: baseCost };
}
