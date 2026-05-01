import { useState, useCallback, useRef } from 'react';

const DB_URL = import.meta.env.VITE_FIREBASE_URL;

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'WC-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function getMemberId() {
  let id = localStorage.getItem('wc2026_memberId');
  if (!id) { id = Math.random().toString(36).slice(2, 10); localStorage.setItem('wc2026_memberId', id); }
  return id;
}

export function useRoom() {
  const [room, setRoom] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wc2026_room') || 'null'); } catch { return null; }
  });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const memberId = getMemberId();

  const saveRoom = (r) => {
    setRoom(r);
    try { localStorage.setItem('wc2026_room', JSON.stringify(r)); } catch {}
  };

  const pushSnapshot = useCallback(async (code, name, album, dupes) => {
    if (!DB_URL) return;
    const snapshot = {
      name,
      album: [...album],
      dupes: Object.fromEntries(dupes),
      updated: Date.now(),
      memberId,
    };
    await fetch(`${DB_URL}/rooms/${code}/${memberId}.json`, {
      method: 'PUT',
      body: JSON.stringify(snapshot),
    });
  }, [memberId]);

  const fetchMembers = useCallback(async (code) => {
    if (!DB_URL) return;
    try {
      const res = await fetch(`${DB_URL}/rooms/${code}.json`);
      const data = await res.json();
      if (data && typeof data === 'object') {
        setMembers(Object.entries(data).map(([id, val]) => ({ ...val, memberId: id })));
      }
    } catch {}
  }, []);

  const startPolling = useCallback((code) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchMembers(code), 15000);
  }, [fetchMembers]);

  const createRoom = useCallback(async (name, album, dupes) => {
    setLoading(true); setError(null);
    const code = genCode();
    saveRoom({ code, name, memberId });
    try {
      await pushSnapshot(code, name, album, dupes);
      await fetchMembers(code);
      startPolling(code);
    } catch { setError('Could not connect. Check your Firebase URL in .env'); }
    setLoading(false);
    return code;
  }, [memberId, pushSnapshot, fetchMembers, startPolling]);

  const joinRoom = useCallback(async (code, name, album, dupes) => {
    setLoading(true); setError(null);
    const r = { code: code.trim().toUpperCase(), name, memberId };
    saveRoom(r);
    try {
      await pushSnapshot(r.code, name, album, dupes);
      await fetchMembers(r.code);
      startPolling(r.code);
    } catch { setError('Room not found or connection failed.'); }
    setLoading(false);
  }, [memberId, pushSnapshot, fetchMembers, startPolling]);

  const sync = useCallback((album, dupes) => {
    if (!room || !DB_URL) return;
    pushSnapshot(room.code, room.name, album, dupes);
  }, [room, pushSnapshot]);

  const leaveRoom = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setRoom(null); setMembers([]);
    localStorage.removeItem('wc2026_room');
  }, []);

  return { room, members, loading, error, memberId, createRoom, joinRoom, sync, leaveRoom, fetchMembers };
}
