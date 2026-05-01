import { useState, useEffect, useCallback } from 'react';
import { parseId } from './data.js';

const KEY_ALBUM = 'wc2026_album_v1';   // Set of sticker IDs in the physical album
const KEY_DUPES = 'wc2026_dupes_v1';   // Map of sticker ID → dupe count

function loadSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
}
function loadMap(key) {
  try { return new Map(Object.entries(JSON.parse(localStorage.getItem(key) || '{}')));  } catch { return new Map(); }
}
function saveSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch {}
}
function saveMap(key, map) {
  try { localStorage.setItem(key, JSON.stringify(Object.fromEntries(map))); } catch {}
}

export function useStore() {
  // album: Set of sticker IDs you have stuck in your physical book
  const [album, setAlbum] = useState(() => loadSet(KEY_ALBUM));
  // dupes: Map of sticker ID → how many extras you have to trade
  const [dupes, setDupes] = useState(() => loadMap(KEY_DUPES));

  useEffect(() => { saveSet(KEY_ALBUM, album); }, [album]);
  useEffect(() => { saveMap(KEY_DUPES, dupes); }, [dupes]);

  // Toggle a sticker in the album (tap on grid cell)
  // Returns: 'removed' | 'promoted' | 'added'
  // If removed and has dupes, caller should show the promote modal
  const toggleAlbum = useCallback((id) => {
    if (album.has(id)) {
      // Removing from album
      const next = new Set(album);
      next.delete(id);
      setAlbum(next);
      return dupes.has(id) ? 'has-dupes' : 'removed';
    } else {
      // Adding to album
      const next = new Set(album);
      next.add(id);
      setAlbum(next);
      return 'added';
    }
  }, [album, dupes]);

  // Promote: move one dupe into the album (called after modal confirm)
  const promoteToAlbum = useCallback((id) => {
    setAlbum(prev => new Set([...prev, id]));
    setDupes(prev => {
      const next = new Map(prev);
      const count = (next.get(id) || 1) - 1;
      if (count <= 0) next.delete(id);
      else next.set(id, count);
      return next;
    });
  }, []);

  // Add a dupe (one extra copy beyond what's in the album)
  const addDupe = useCallback((id) => {
    setDupes(prev => {
      const next = new Map(prev);
      next.set(id, (next.get(id) || 0) + 1);
      return next;
    });
  }, []);

  // Remove one dupe (traded away)
  const removeDupe = useCallback((id) => {
    setDupes(prev => {
      const next = new Map(prev);
      const count = (next.get(id) || 0) - 1;
      if (count <= 0) next.delete(id);
      else next.set(id, count);
      return next;
    });
  }, []);

  // Bulk input handler: "ARG-3, SUI-15, ARG-3"
  // Smart routing: if not in album → add to album; if already in album → add to dupes
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
        dupesNext.set(id, (dupesNext.get(id) || 0) + 1);
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
  }, []);

  return { album, dupes, toggleAlbum, promoteToAlbum, addDupe, removeDupe, bulkAdd, resetAll };
}
