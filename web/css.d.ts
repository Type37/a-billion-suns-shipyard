declare module "*.css";

// Carbon icon descriptors (see carbon-icons.ts). The package ships no types
// for its per-icon modules.
declare module "@carbon/icons/es/*/16.js" {
  const descriptor: { elem: string; attrs: Record<string, string | number>; content?: { elem: string; attrs: Record<string, string | number> }[] };
  export default descriptor;
}
