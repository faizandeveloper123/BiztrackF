const OPEN_OVERLAY_SELECTOR = [
  '[data-radix-dialog-overlay][data-state="open"]',
  '[role="dialog"][data-state="open"]',
  '[data-radix-alert-dialog-overlay][data-state="open"]',
].join(", ");

export function releaseStaleOverlayLocks(delayMs = 300): void {
  if (typeof document === "undefined") return;

  window.setTimeout(() => {
    if (document.querySelector(OPEN_OVERLAY_SELECTOR)) return;

    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    document.body.removeAttribute("data-scroll-locked");
    document.documentElement.style.pointerEvents = "";
    document.documentElement.style.overflow = "";
    document.documentElement.removeAttribute("data-scroll-locked");
  }, delayMs);
}

export function handleOverlayOpenChange(
  open: boolean,
  onOpenChange?: (open: boolean) => void,
): void {
  if (!open) {
    onOpenChange?.(false);
    releaseStaleOverlayLocks(0);
    releaseStaleOverlayLocks(300);
    return;
  }
  onOpenChange?.(true);
}
