import { useEffect } from "react";

/**
 * Shows/hides the App Bridge Contextual Save Bar based on dirty state.
 * Requires a matching <SaveBar id={id}> (or <ui-save-bar id={id}>) in the tree.
 */
export function useContextualSaveBar(id, isDirty) {
  useEffect(() => {
    const saveBar = typeof window !== "undefined" ? window.shopify?.saveBar : null;
    if (!saveBar || !id) return;

    if (isDirty) {
      saveBar.show(id).catch(() => {});
    } else {
      saveBar.hide(id).catch(() => {});
    }

    return () => {
      saveBar.hide(id).catch(() => {});
    };
  }, [id, isDirty]);
}

export function arraysEqualAsSets(a = [], b = []) {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((item) => setB.has(item));
}
