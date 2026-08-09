import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

/**
 * Mount, hold and unmount the image cropper.
 *
 * Cropper.js is the one third-party widget in the app and the only thing here
 * that owns its own DOM. That is why the stage carries data-morph-skip (see
 * morph.ts): render() emits an empty container, the cropper fills it, and the
 * morph leaves those nodes alone so an unrelated repaint - a toast appearing, a
 * sync landing - cannot delete the crop box while you are dragging it.
 *
 * Everything else follows from that. The instance lives here rather than in the
 * store (it is not data, and nothing renders from it), it is built once per
 * opened image and keyed on the source so a DIFFERENT image rebuilds it, and it
 * is destroyed the moment the stage leaves the page - a cropper left mounted
 * keeps window listeners and a ResizeObserver alive for a dialog that is gone.
 *
 * Its own module rather than a corner of main.ts, because actions.ts needs to
 * reach the live instance for Rotate/Reset/Use, and main.ts already imports
 * actions.ts - putting it there would have made that pair circular.
 */
let cropper: Cropper | null = null;
let cropperSrc: string | null = null;
let cropperStage: HTMLElement | null = null;

/** The live instance, for the crop dialog's own buttons. */
export function activeCropper(): Cropper | null {
  return cropper;
}

/** Called from paint(): builds, keeps or tears down to match what is rendered. */
export function syncCropper(): void {
  const stage = document.querySelector<HTMLElement>("[data-crop-stage]");
  if (!stage) {
    cropper?.destroy();
    cropper = null;
    cropperSrc = null;
    cropperStage = null;
    return;
  }
  /*
   * Keep the existing cropper only if it is genuinely still THIS one: the same
   * instance, in the same stage element, on the same picture, with its DOM
   * still present.
   *
   * Matching on the source alone was not enough and failed in a way worth
   * recording. Crop a picture for an emblem, then drop the SAME file on a ship
   * class: the source string matches, so the sync decided there was nothing to
   * do - but the stage it decided that about was a brand new, empty element,
   * and the cropper it kept was mounted in a node no longer on the page. The
   * dialog opened onto a blank rectangle.
   */
  const src = stage.dataset["src"] ?? "";
  const mounted = cropper && cropperStage === stage && cropperSrc === src && stage.querySelector(".cropper-container");
  if (mounted) return;
  cropper?.destroy();
  cropper = null;
  cropperStage = stage;

  const img = document.createElement("img");
  img.alt = "";
  img.src = src;
  stage.replaceChildren(img);
  cropperSrc = src;
  cropper = new Cropper(img, {
    aspectRatio: Number(stage.dataset["aspect"]) || 1,
    // 1: the crop box stays inside the picture, so no upload can end up with a
    // band of empty canvas down one side.
    viewMode: 1,
    // Opens on the largest centred crop the frame allows - which is exactly the
    // automatic fit this step replaced. Accepting the default is one press, so
    // nothing got slower for an image that was already framed right.
    autoCropArea: 1,
    dragMode: "move",
    background: false,
    responsive: true,
    // Phone photos carry EXIF orientation; without this a portrait shot arrives
    // on its side.
    checkOrientation: true,
  });
}
