// Updating the page in place instead of rebuilding it.
//
// The app renders to a single HTML string and used to assign it straight to
// #app.innerHTML. That is simple and was fine for a while, but it destroys and
// recreates every node on every state change - about 150KB of DOM for one press
// of a stepper button. The costs are all things you can feel rather than
// measure:
//
//   - The button under the pointer is replaced, so it loses :hover and any
//     transition mid-flight restarts from its base state. In the builder's left
//     panel 187 elements carry a transition, so a click there flickers.
//   - Scroll positions, focus, caret and open <details> all reset, so each one
//     needed its own save/restore hook around the assignment.
//   - Any animation started by the render is wiped by the next render, which is
//     why the add-ship animation had to be ordered around the toast.
//
// So: diff the freshly rendered tree against the live one and touch only what
// actually differs. Nodes that did not change are left alone, which is what
// makes hover, transitions, scroll, focus and animations survive.
//
// This is deliberately small - no virtual DOM, no component model, no
// lifecycle. It reconciles attributes, text and children, with keys for lists
// so reordering moves nodes rather than rewriting them.

/**
 * Attributes that identify a node across renders, best first. A keyed child is
 * matched to the same key in the old tree wherever it moved to, so adding a unit
 * to the middle of the roster shifts its neighbours instead of rewriting them.
 *
 * These must be unique among siblings. Note what is NOT here: data-unit and
 * data-ship identify the unit or ship a control acts on, not the control - both
 * buttons of a stepper carry the same data-unit, so treating it as a key made
 * them collide and the (+) button got matched to the (-) slot.
 */
const KEY_ATTRS = ["data-key", "data-roster-key", "id"];

function keyOf(el: Element): string | undefined {
  for (const attr of KEY_ATTRS) {
    const v = el.getAttribute(attr);
    if (v) return `${attr}=${v}`;
  }
  return undefined;
}

/** Copy attributes from `to` onto `from`, removing any that no longer apply. */
function morphAttributes(from: Element, to: Element): void {
  for (const attr of Array.from(to.attributes)) {
    if (from.getAttribute(attr.name) !== attr.value) from.setAttribute(attr.name, attr.value);
  }
  for (const attr of Array.from(from.attributes)) {
    if (!to.hasAttribute(attr.name)) from.removeAttribute(attr.name);
  }
}

/**
 * Form state lives in properties, not attributes, so setting an attribute alone
 * would leave the rendered value invisible (or clobber what the user is typing).
 * The rendered value wins only when it actually differs, so a re-render during
 * typing does not fight the caret.
 */
function morphFormState(from: Element, to: Element): void {
  if (from instanceof HTMLInputElement && to instanceof HTMLInputElement) {
    if (from.type === "checkbox" || from.type === "radio") {
      if (from.checked !== to.defaultChecked) from.checked = to.defaultChecked;
    } else if (from.value !== to.getAttribute("value") && document.activeElement !== from) {
      from.value = to.getAttribute("value") ?? "";
    }
  } else if (from instanceof HTMLTextAreaElement && to instanceof HTMLTextAreaElement) {
    if (document.activeElement !== from && from.value !== to.textContent) from.value = to.textContent ?? "";
  } else if (from instanceof HTMLSelectElement && to instanceof HTMLSelectElement) {
    if (document.activeElement !== from && from.value !== to.value) from.value = to.value;
  } else if (from instanceof HTMLDetailsElement && to instanceof HTMLDetailsElement) {
    // `open` is reflected, and morphAttributes already handled it; nothing else
    // to do, but keeping the branch documents that details are intentional.
  }
}

function isElement(n: Node): n is Element {
  return n.nodeType === Node.ELEMENT_NODE;
}

/** Reconcile one node pair. Returns the node now living in the document. */
function morphNode(from: Node, to: Node): Node {
  // Identical subtrees are the common case on a small state change: most of the
  // page is unchanged. Bailing here is what keeps this cheap.
  if (from.isEqualNode(to)) return from;

  if (from.nodeType !== to.nodeType || from.nodeName !== to.nodeName) {
    const replacement = to.cloneNode(true);
    (from as ChildNode).replaceWith(replacement);
    return replacement;
  }

  if (!isElement(from) || !isElement(to)) {
    // Text, comment: content is all there is.
    if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue;
    return from;
  }

  /*
   * A subtree this renderer does not own.
   *
   * render() emits an empty container and something else fills it - the image
   * cropper, which builds a few dozen nodes of its own inside one and tracks
   * them by reference. Everything else on the page can be rebuilt from state at
   * any moment; that cannot, and a repaint from an unrelated corner of the app
   * (a toast appearing, Fleet Sync landing) would otherwise delete the crop box
   * out from under the pointer mid-drag.
   *
   * Attributes are still reconciled - those come from the render and are how
   * the container is addressed. Only the children are left alone.
   */
  if (from.hasAttribute("data-morph-skip")) {
    morphAttributes(from, to);
    return from;
  }

  morphAttributes(from, to);
  morphChildren(from, to);
  morphFormState(from, to);
  return from;
}

function morphChildren(from: Element, to: Element): void {
  // Keys the new tree actually asks for. An old node may carry a key the new
  // tree never mentions - paint() stamps id="main-content" onto <main> after
  // morphing, so the live <main> looks keyed while its freshly rendered
  // counterpart does not. Such a node must still be available for ordinary
  // positional matching, or the unkeyed newcomer skips past it, pairs with the
  // following sibling, mismatches, and replaces the entire rest of the list.
  // A key repeated among siblings identifies nothing, so it is discarded rather
  // than trusted: two children claiming one key would have the second matched to
  // the first's node and everything after it rebuilt.
  const wantedKeys = new Set<string>();
  const duplicateKeys = new Set<string>();
  for (const child of Array.from(to.children)) {
    const k = keyOf(child);
    if (!k) continue;
    if (wantedKeys.has(k)) duplicateKeys.add(k);
    wantedKeys.add(k);
  }
  for (const dup of duplicateKeys) wantedKeys.delete(dup);

  // Index the old children that carry a wanted key, so a moved node is found
  // rather than rebuilt.
  const keyed = new Map<string, Element>();
  for (const child of Array.from(from.children)) {
    const k = keyOf(child);
    if (k && wantedKeys.has(k)) keyed.set(k, child);
  }

  let oldChild = from.firstChild;
  for (const newChild of Array.from(to.childNodes)) {
    const rawKey = isElement(newChild) ? keyOf(newChild) : undefined;
    const wantedKey = rawKey && wantedKeys.has(rawKey) ? rawKey : undefined;

    if (wantedKey) {
      const existing = keyed.get(wantedKey);
      if (existing) {
        // Move it into place if it drifted, then reconcile in place.
        if (existing !== oldChild) from.insertBefore(existing, oldChild);
        else oldChild = oldChild.nextSibling;
        morphNode(existing, newChild);
        keyed.delete(wantedKey);
        continue;
      }
      from.insertBefore(newChild.cloneNode(true), oldChild);
      continue;
    }

    // Unkeyed: pair up positionally, skipping any keyed survivor that belongs
    // later in the list so it is not consumed by the wrong slot.
    while (oldChild && isElement(oldChild) && keyOf(oldChild) && keyed.has(keyOf(oldChild)!)) {
      oldChild = oldChild.nextSibling;
    }
    if (oldChild) {
      const next = oldChild.nextSibling;
      morphNode(oldChild, newChild);
      oldChild = next;
    } else {
      from.appendChild(newChild.cloneNode(true));
    }
  }

  // Anything left over is gone from the new tree. Keyed survivors that were
  // never claimed are dropped too - their key vanished from the new render.
  while (oldChild) {
    const next = oldChild.nextSibling;
    from.removeChild(oldChild);
    oldChild = next;
  }
  for (const orphan of keyed.values()) orphan.remove();
}

/**
 * Update `root` so its contents match `html`, reusing every node that has not
 * changed. Replaces `root.innerHTML = html`.
 */
export function morphInto(root: Element, html: string): void {
  const template = document.createElement(root.tagName);
  template.innerHTML = html;
  morphChildren(root, template);
}
