"use client";

import { useEffect } from "react";

export function DesktopRuntimeClass() {
  useEffect(() => {
    const isTauri =
      typeof window !== "undefined" &&
      ("__TAURI__" in window || "__TAURI_INTERNALS__" in window);

    if (isTauri) {
      document.documentElement.classList.add("desktop-app");
    } else {
      document.documentElement.classList.remove("desktop-app");
    }
  }, []);

  return null;
}
