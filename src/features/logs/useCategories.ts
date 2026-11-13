import { useCallback, useState } from 'react';
import { loadCustomCategories, saveCustomCategories } from './entryStorage';
import { DEFAULT_CATEGORIES, type CategoryKind } from './entryTypes';

/** Default categories plus any the user has added. Returns `[categories, addCategory]`. */
export function useCategories(kind: CategoryKind): [string[], (name: string) => void] {
  const [custom, setCustom] = useState(loadCustomCategories);

  const categories = [...DEFAULT_CATEGORIES[kind], ...custom[kind]];

  const addCategory = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setCustom((prev) => {
        const exists = [...DEFAULT_CATEGORIES[kind], ...prev[kind]].some(
          (c) => c.toLowerCase() === trimmed.toLowerCase(),
        );
        if (exists) return prev;
        const next = { ...prev, [kind]: [...prev[kind], trimmed] };
        saveCustomCategories(next);
        return next;
      });
    },
    [kind],
  );

  return [categories, addCategory];
}
