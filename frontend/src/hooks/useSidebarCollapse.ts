"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "biztrack:sidebar:collapsed";

export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
    } catch {}
    setReady(true);
  }, []);

  const persist = useCallback((next: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      persist(next);
      return next;
    });
  }, [persist]);

  const expand = useCallback(() => {
    setCollapsed(false);
    persist(false);
  }, [persist]);

  return { collapsed, toggle, expand, ready };
}
