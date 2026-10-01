/**
 * Interface icons come from IBM's Carbon icon set (@carbon/icons), the icon
 * family that belongs to the Carbon components the app is built on. Before
 * October 2026 every one of these was drawn by hand in icons.ts (with a few
 * borrowed from Siemens iX), and Jet's rule since is: no hand-drawn icons.
 *
 * What is NOT here, on purpose: the firing-arc glyphs (arc-primary, arc-aux),
 * which Jet kept, and the Mass mark, which is the rulebook's own character
 * lifted from the font it was printed in. Fleet emblems are a separate set.
 *
 * Each import is the 16px Carbon descriptor ({elem, attrs, content}); icon()
 * in icons.ts serialises it at whatever size it is asked for.
 */
import c_user from "@carbon/icons/es/user/16.js";
import c_catalog from "@carbon/icons/es/catalog/16.js";
import c_list from "@carbon/icons/es/list/16.js";
import c_settings_adjust from "@carbon/icons/es/settings--adjust/16.js";
import c_rule from "@carbon/icons/es/rule/16.js";
import c_add from "@carbon/icons/es/add/16.js";
import c_subtract from "@carbon/icons/es/subtract/16.js";
import c_close from "@carbon/icons/es/close/16.js";
import c_checkmark from "@carbon/icons/es/checkmark/16.js";
import c_warning_alt from "@carbon/icons/es/warning--alt/16.js";
import c_checkbox_checked_filled from "@carbon/icons/es/checkbox--checked--filled/16.js";
import c_printer from "@carbon/icons/es/printer/16.js";
import c_link from "@carbon/icons/es/link/16.js";
import c_home from "@carbon/icons/es/home/16.js";
import c_edit from "@carbon/icons/es/edit/16.js";
import c_copy from "@carbon/icons/es/copy/16.js";
import c_share from "@carbon/icons/es/share/16.js";
import c_play from "@carbon/icons/es/play/16.js";
import c_overflow_menu_vertical from "@carbon/icons/es/overflow-menu--vertical/16.js";
import c_trash_can from "@carbon/icons/es/trash-can/16.js";
import c_save from "@carbon/icons/es/save/16.js";
import c_chevron_down from "@carbon/icons/es/chevron--down/16.js";
import c_chevron_right from "@carbon/icons/es/chevron--right/16.js";
import c_chevron_left from "@carbon/icons/es/chevron--left/16.js";
import c_overflow_menu_horizontal from "@carbon/icons/es/overflow-menu--horizontal/16.js";
import c_menu from "@carbon/icons/es/menu/16.js";
import c_information from "@carbon/icons/es/information/16.js";
import c_book from "@carbon/icons/es/book/16.js";
import c_flag from "@carbon/icons/es/flag/16.js";
import c_tool_kit from "@carbon/icons/es/tool-kit/16.js";
import c_document from "@carbon/icons/es/document/16.js";
import c_upload from "@carbon/icons/es/upload/16.js";
import c_download from "@carbon/icons/es/download/16.js";
import c_filter from "@carbon/icons/es/filter/16.js";
import c_shuffle from "@carbon/icons/es/shuffle/16.js";
import c_grid from "@carbon/icons/es/grid/16.js";
import c_settings from "@carbon/icons/es/settings/16.js";
import c_compare from "@carbon/icons/es/compare/16.js";
import c_renew from "@carbon/icons/es/renew/16.js";
import c_image from "@carbon/icons/es/image/16.js";
import c_logo_discord from "@carbon/icons/es/logo--discord/16.js";
import c_user_military from "@carbon/icons/es/user--military/16.js";
import c_deployment_policy from "@carbon/icons/es/deployment-policy/16.js";
import c_target from "@carbon/icons/es/target/16.js";
import c_security from "@carbon/icons/es/security/16.js";
import c_cube from "@carbon/icons/es/cube/16.js";
import c_triangle_solid from "@carbon/icons/es/triangle--solid/16.js";
import c_tool_box from "@carbon/icons/es/tool-box/16.js";
import c_erase from "@carbon/icons/es/erase/16.js";
import c_earth from "@carbon/icons/es/earth/16.js";

type Node = { elem: string; attrs: Record<string, string | number>; content?: Node[] };

export const CARBON_ICONS: Record<string, Node> = {
  "solo": c_user,
  "compendium": c_catalog,
  "fleets": c_list,
  "options": c_settings_adjust,
  "custom-rules": c_rule,
  "plus": c_add,
  "minus": c_subtract,
  "close": c_close,
  "check": c_checkmark,
  "warning": c_warning_alt,
  "legal": c_checkbox_checked_filled,
  "print": c_printer,
  "link": c_link,
  "home": c_home,
  "pencil": c_edit,
  "duplicate": c_copy,
  "ix-duplicate": c_copy,
  "ix-share": c_share,
  "ix-play": c_play,
  "ix-context-menu": c_overflow_menu_vertical,
  "ix-trash": c_trash_can,
  "trash": c_trash_can,
  "save": c_save,
  "chevronDown": c_chevron_down,
  "chevronRight": c_chevron_right,
  "chevronLeft": c_chevron_left,
  "more": c_overflow_menu_horizontal,
  "menu": c_menu,
  "info": c_information,
  "book": c_book,
  "flag": c_flag,
  "wrench": c_tool_kit,
  "scroll": c_document,
  "upload": c_upload,
  "download": c_download,
  "filter": c_filter,
  "shuffle": c_shuffle,
  "random": c_shuffle,
  "grid": c_grid,
  "settings": c_settings,
  "sliders": c_settings_adjust,
  "compare": c_compare,
  "sync": c_renew,
  "image": c_image,
  "discord": c_logo_discord,
  "commander": c_user_military,
  // Thrust: carbon:deployment-policy, Jet's pick (tried "rocket", then
  // "double-chevron-right").
  "stat-thrust": c_deployment_policy,
  "stat-silhouette": c_target,
  "stat-shields": c_security,
  "die": c_cube,
  "cmd-delta": c_triangle_solid,
  "utility": c_tool_box,
  "eraser": c_erase,
  "logo": c_earth,
};

function attrs(a: Record<string, string | number>): string {
  return Object.entries(a)
    .map(([k, v]) => ` ${k}="${String(v)}"`)
    .join("");
}

function node(n: Node): string {
  return `<${n.elem}${attrs(n.attrs)}>${(n.content ?? []).map(node).join("")}</${n.elem}>`;
}

export function carbonSvg(d: Node, size: number, cls: string): string {
  const vb = String(d.attrs["viewBox"] ?? "0 0 32 32");
  return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="${vb}" fill="currentColor" aria-hidden="true">${(d.content ?? []).map(node).join("")}</svg>`;
}
