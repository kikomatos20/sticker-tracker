import { useState, useEffect, useCallback } from 'react';
import { parseId } from './data.js';

const KEY_ALBUM = 'wc2026_album_v2';
const KEY_DUPES = 'wc2026_dupes_v2';
const KEY_VARIANTS = 'wc2026_variants_v2';

export const VARIANTS = ['base','blue','red','purple','green','black','orange','gold'];
export const VARIANT_COLORS = {
  base:   { label:'Base',   bg:'#1a3a20', border:'#2a6a40', text:'#3ddc84' },
  blue:   { label:'Blue',   bg:'#0d1f3c', border:'#1a4a8a', text:'#5b9bd5' },
  red:    { label:'Red',    bg:'#3a0d0d', border:'#8a1a1a', text:'#e05555' },
  purple: { label:'Purple', bg:'#2a0d3a', border:'#6a1a8a', text:'#b05bd5' },
  green:  { label:'Green',  bg:'#0d2a0d', border:'#1a6a1a', text:'#3ddc3d' },
  black:  { label:'Black',  bg:'#1a1a1a', border:'#444',    text:'#aaa'    },
  orange: { label:'Orange', bg:'#3a1a0d', border:'#8a4a1a', text:'#e0853d' },
  gold:   { label:'Gold',   bg:'#2c2608', border:'#6a5a10', text:'#f5c518' },
};

function loadSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
}
function loadMap(key) {
  try { return new Map(Object.entries(JSON.parse(localStorage.getItem(key) || '{}'))); } catch { return new Map(); }
}
function saveSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch {}
}
function saveMap(key, map) {
  try { localStorage.setItem(key, JSON.stringify(Object.fromEntries(map))); } catch {}
}

export function useStore() {
  const [album, setAlbum] = useState(() => loadSet(KEY_ALBUM));
  const [dupes, setDupes] = useState(() => loadMap(KEY_DUPES));
  // variants: Map of stickerId -> variant string (base/blue/red/etc)
  const [variants, setVariants] = useState(() => loadMap(KEY_VARIANTS));

  useEffect(() => { saveSet(KEY_ALBUM, album); }, [album]);
  useEffect(() => { saveMap(KEY_DUPES, dupes); }, [dupes]);
  useEffect(() => { saveMap(KEY_VARIANTS, variants); }, [variants]);

  const setVariant = useCallback((id, variant) => {
    setVariants(prev => {
      const next = new Map(prev);
      next.set(id, variant);
      return next;
    });
  }, []);

  const toggleAlbum = useCallback((id) => {
    if (album.has(id)) {
      const next = new Set(album);
      next.delete(id);
      setAlbum(next);
      return dupes.has(id) ? 'has-dupes' : 'removed';
    } else {
      const next = new Set(album);
      next.add(id);
      setAlbum(next);
      return 'added';
    }
  }, [album, dupes]);

  const promoteToAlbum = useCallback((id) => {
    setAlbum(prev => new Set([...prev, id]));
    setDupes(prev => {
      const next = new Map(prev);
      const entry = next.get(id) || {};
      // reduce total count
      const total = Object.values(entry).reduce((s,c) => s+c, 0);
      if (total <= 1) { next.delete(id); return next; }
      // remove one from the first variant that has count
      for (const v of VARIANTS) {
        if (entry[v] > 0) {
          entry[v]--;
          if (entry[v] === 0) delete entry[v];
          break;
        }
      }
      next.set(id, entry);
      return next;
    });
  }, []);

  const addDupe = useCallback((id, variant = 'base') => {
    setDupes(prev => {
      const next = new Map(prev);
      const entry = { ...(next.get(id) || {}) };
      entry[variant] = (entry[variant] || 0) + 1;
      next.set(id, entry);
      return next;
    });
  }, []);

  const removeDupe = useCallback((id, variant = 'base') => {
    setDupes(prev => {
      try {
        const next = new Map(prev);
        const entry = { ...(next.get(id) || {}) };
        if (!entry[variant] || entry[variant] <= 0) {
          // fallback: remove any variant
          const anyVariant = Object.keys(entry)[0];
          if (!anyVariant) { next.delete(id); return next; }
          entry[anyVariant]--;
          if (entry[anyVariant] <= 0) delete entry[anyVariant];
        } else {
          entry[variant]--;
          if (entry[variant] <= 0) delete entry[variant];
        }
        if (Object.keys(entry).length === 0) next.delete(id);
        else next.set(id, entry);
        return next;
      } catch { return prev; }
    });
  }, []);

  const bulkAdd = useCallback((input) => {
    const parts = input.split(/[\s,;]+/).filter(Boolean);
    const results = { album: [], dupes: [], notFound: [] };
    const albumNext = new Set(album);
    const dupesNext = new Map(dupes);

    parts.forEach(p => {
      const parsed = parseId(p);
      if (!parsed) { results.notFound.push(p.toUpperCase()); return; }
      const id = `${parsed.teamId}-${parsed.num}`;
      if (!albumNext.has(id)) {
        albumNext.add(id);
        results.album.push(id);
      } else {
        const entry = { ...(dupesNext.get(id) || {}) };
        entry['base'] = (entry['base'] || 0) + 1;
        dupesNext.set(id, entry);
        results.dupes.push(id);
      }
    });

    setAlbum(albumNext);
    setDupes(dupesNext);
    return results;
  }, [album, dupes]);

  const resetAll = useCallback(() => {
    setAlbum(new Set());
    setDupes(new Map());
    setVariants(new Map());
  }, []);

  return { album, dupes, variants, toggleAlbum, promoteToAlbum, addDupe, removeDupe, setVariant, bulkAdd, resetAll };
}
