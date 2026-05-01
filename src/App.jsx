import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { TEAMS, TOTAL_STICKERS } from './data.js';
import { useStore } from './useStore.js';
import { useRoom } from './useRoom.js';
import './App.css';

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success' }) {
  if (!message) return null;
  return <div className={`toast toast-${type}`}>{message}</div>;
}

// ── Promote Modal ──────────────────────────────────────────────────────────
function PromoteModal({ stickerId, onPromote, onDismiss }) {
  if (!stickerId) return null;
  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">📦</div>
        <div className="modal-title">You have a duplicate of <span className="modal-id">{stickerId}</span></div>
        <div className="modal-sub">Move it from your duplicates pile into your album?</div>
        <div className="modal-actions">
          <button className="modal-btn modal-btn-primary" onClick={onPromote}>Yes, move to album</button>
          <button className="modal-btn modal-btn-secondary" onClick={onDismiss}>No, just remove it</button>
        </div>
      </div>
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────
function Section({ team, album, dupes, onCellTap, filter }) {
  const [open, setOpen] = useState(false);
  const stickers = useMemo(() => Array.from({ length: team.count }, (_, i) => i + 1), [team.count]);

  const have = useMemo(() => stickers.filter(n => album.has(`${team.id}-${n}`)).length, [stickers, album, team.id]);
  const teamDupesCount = useMemo(() =>
    stickers.reduce((s, n) => s + (dupes.get(`${team.id}-${n}`) || 0), 0),
    [stickers, dupes, team.id]
  );
  const pct = Math.round((have / team.count) * 100);

  const visible = useMemo(() => stickers.filter(n => {
    const id = `${team.id}-${n}`;
    const inAlbum = album.has(id);
    if (filter === 'all') return true;
    if (filter === 'have') return inAlbum;
    if (filter === 'missing') return !inAlbum;
    if (filter === 'dupes') return dupes.has(id);
    return true;
  }), [stickers, album, dupes, team.id, filter]);

  if (filter !== 'all' && visible.length === 0) return null;

  const teamDupesList = useMemo(() =>
    stickers
      .filter(n => dupes.has(`${team.id}-${n}`))
      .map(n => ({ id: `${team.id}-${n}`, count: dupes.get(`${team.id}-${n}`) })),
    [stickers, dupes, team.id]
  );

  return (
    <div className="section">
      <div className="sec-hdr" onClick={() => setOpen(o => !o)}>
        <span className="sec-flag">{team.flag}</span>
        <span className="sec-name">{team.name}</span>
        {team.group && <span className="sec-group">Grp {team.group}</span>}
        {teamDupesCount > 0 && <span className="sec-dupes-badge">+{teamDupesCount} dupes</span>}
        <div className="mini-track"><div className="mini-fill" style={{ width: `${pct}%` }} /></div>
        <span className="sec-stat"><b>{have}</b>/{team.count}</span>
        <span className={`chev ${open ? 'open' : ''}`}>▼</span>
      </div>

      {open && (
        <div className="sec-body">
          {/* Album grid */}
          <div className="grid">
            {visible.map(n => {
              const id = `${team.id}-${n}`;
              const inAlbum = album.has(id);
              return (
                <div
                  key={n}
                  className={`cell ${inAlbum ? 'have' : ''}`}
                  onClick={() => onCellTap(id)}
                  title={id}
                >
                  <span className="cell-num">{n}</span>
                  <span className="cell-label">{team.id}</span>
                </div>
              );
            })}
          </div>

          {/* Dupes row for this team */}
          {teamDupesList.length > 0 && (
            <div className="team-dupes-row">
              <span className="team-dupes-label">Duplicates:</span>
              <div className="team-dupes-list">
                {teamDupesList.map(({ id, count }) => (
                  <DupeChip key={id} id={id} count={count} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Dupe Chip (used in team row + swaps tab) ───────────────────────────────
function DupeChip({ id, count, onRemove }) {
  return (
    <div className="dupe-chip">
      <span className="dupe-chip-id">{id}</span>
      <span className="dupe-chip-count">×{count}</span>
      {onRemove && (
        <button className="dupe-chip-minus" onClick={() => onRemove(id)} title="Traded one away">−</button>
      )}
    </div>
  );
}

// ── Swaps Tab ──────────────────────────────────────────────────────────────
function SwapsTab({ dupes, onRemoveDupe }) {
  const items = useMemo(() => {
    const list = [];
    TEAMS.forEach(team => {
      Array.from({ length: team.count }, (_, i) => i + 1).forEach(n => {
        const id = `${team.id}-${n}`;
        const count = dupes.get(id) || 0;
        if (count > 0) list.push({ id, team, count });
      });
    });
    return list;
  }, [dupes]);

  if (!items.length) return (
    <div className="empty-state">
      <div className="empty-icon">📦</div>
      <div>No duplicates yet — keep opening packs!</div>
    </div>
  );

  // Group by team
  const byTeam = useMemo(() => {
    const map = new Map();
    items.forEach(item => {
      if (!map.has(item.team.id)) map.set(item.team.id, { team: item.team, items: [] });
      map.get(item.team.id).items.push(item);
    });
    return [...map.values()];
  }, [items]);

  const totalDupes = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className="list-pane">
      <div className="list-meta">{items.length} sticker types · {totalDupes} total extras to trade</div>
      {byTeam.map(({ team, items: teamItems }) => (
        <div key={team.id} className="swap-team-block">
          <div className="swap-team-header">
            <span>{team.flag}</span>
            <span className="swap-team-name">{team.name}</span>
            <span className="swap-team-count">{teamItems.reduce((s, i) => s + i.count, 0)} extras</span>
          </div>
          <div className="swap-chips">
            {teamItems.map(({ id, count }) => (
              <DupeChip key={id} id={id} count={count} onRemove={onRemoveDupe} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Missing Tab ────────────────────────────────────────────────────────────
function MissingTab({ album, missingCount }) {
  const grouped = useMemo(() =>
    TEAMS.map(team => ({
      ...team,
      missing: Array.from({ length: team.count }, (_, i) => i + 1)
        .filter(n => !album.has(`${team.id}-${n}`)),
    })).filter(t => t.missing.length > 0),
    [album]
  );

  const exportTxt = () => {
    const lines = grouped.map(t =>
      `${t.flag} ${t.name}: ${t.missing.map(n => `${t.id}-${n}`).join(', ')}`
    );
    const text = `FIFA WC 2026 – Missing Stickers (${missingCount} total)\n${'─'.repeat(50)}\n\n` + lines.join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = 'missing-stickers-wc2026.txt';
    a.click();
  };

  return (
    <div className="list-pane">
      <div className="list-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{missingCount} stickers still needed</span>
        <button className="btn-export" onClick={exportTxt}>⬇ Export .txt</button>
      </div>
      {grouped.map(team => (
        <div key={team.id} className="missing-block">
          <div className="missing-team-name">{team.flag} {team.name} <span className="missing-count">({team.missing.length})</span></div>
          <div className="missing-pills">
            {team.missing.map(n => (
              <span key={n} className="missing-pill">{team.id}-{n}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Share Tab ──────────────────────────────────────────────────────────────
function ShareTab({ album, dupes, room, members, loading, error, memberId, createRoom, joinRoom, leaveRoom, fetchMembers }) {
  const [myName, setMyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [copied, setCopied] = useState(false);
  const hasFirebase = !!import.meta.env.VITE_FIREBASE_URL;

  const myDupeIds = useMemo(() => new Set([...dupes.keys()]), [dupes]);

  const swapMatches = useMemo(() => {
    const others = members.filter(m => m.memberId !== memberId);
    return others.map(m => {
      const theyNeed = [];
      TEAMS.forEach(team => {
        Array.from({ length: team.count }, (_, i) => i + 1).forEach(n => {
          const id = `${team.id}-${n}`;
          const theirAlbum = new Set(m.album || []);
          if (myDupeIds.has(id) && !theirAlbum.has(id)) theyNeed.push(id);
        });
      });
      return { name: m.name, stickers: theyNeed, have: (m.album || []).length };
    }).filter(m => m.stickers.length > 0);
  }, [members, myDupeIds, memberId]);

  if (!hasFirebase) return (
    <div className="share-card">
      <div className="share-title">Setup required</div>
      <p className="share-sub">Friend sharing needs a free Firebase database. Follow the steps in <code>README.md</code> to set it up, then add your URL to a <code>.env</code> file:</p>
      <div className="code-block">VITE_FIREBASE_URL=https://your-project-default-rtdb.firebaseio.com</div>
      <p className="share-sub" style={{ marginTop: 12 }}>Restart with <code>npm run dev</code> after adding it.</p>
    </div>
  );

  if (!room) return (
    <>
      <div className="share-card">
        <div className="share-title">Create a room</div>
        <p className="share-sub">Generate a code and share it with friends. Everyone in the room can compare collections and find swap matches automatically.</p>
        <div className="input-row">
          <input className="text-input" placeholder="Your name (e.g. Kiko)" value={myName} onChange={e => setMyName(e.target.value)} />
          <button className="btn-primary" disabled={!myName.trim() || loading} onClick={() => createRoom(myName.trim(), album, dupes)}>
            {loading ? 'Creating…' : 'Create room'}
          </button>
        </div>
      </div>
      <div className="share-card">
        <div className="share-title">Join a room</div>
        <p className="share-sub">Have a friend's room code? Paste it below.</p>
        <div className="input-row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <input className="text-input" placeholder="Your name" value={joinName} onChange={e => setJoinName(e.target.value)} style={{ maxWidth: 150 }} />
          <input className="text-input mono" placeholder="WC-XXXX" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} style={{ maxWidth: 140 }} maxLength={7} />
          <button className="btn-primary" disabled={!joinCode.trim() || !joinName.trim() || loading} onClick={() => joinRoom(joinCode, joinName.trim(), album, dupes)}>
            {loading ? 'Joining…' : 'Join'}
          </button>
        </div>
        {error && <p className="error-msg">{error}</p>}
      </div>
    </>
  );

  return (
    <>
      <div className="share-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="share-title" style={{ marginBottom: 0 }}>Room active</div>
          <button className="btn-ghost-sm" onClick={leaveRoom}>Leave room</button>
        </div>
        <p className="share-sub">Share this code with friends:</p>
        <div className="room-code" onClick={() => { navigator.clipboard?.writeText(room.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
          {room.code} <span className="room-code-hint">{copied ? '✓ copied' : 'tap to copy'}</span>
        </div>
      </div>

      <div className="share-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="share-title" style={{ marginBottom: 0 }}>Members ({members.length})</div>
          <button className="btn-ghost-sm" onClick={() => fetchMembers(room.code)}>Refresh</button>
        </div>
        {members.length === 0
          ? <p className="share-sub">No one else yet — share the code!</p>
          : members.map(m => {
              const isMe = m.memberId === memberId;
              const ago = Math.round((Date.now() - (m.updated || 0)) / 60000);
              return (
                <div key={m.memberId} className="member-row">
                  <div className={`member-dot ${ago > 10 ? 'offline' : ''}`} />
                  <span className="member-name">{m.name}{isMe ? ' (you)' : ''}</span>
                  <span className="member-stat">{(m.album || []).length}/{TOTAL_STICKERS} · {ago < 2 ? 'just now' : `${ago}m ago`}</span>
                </div>
              );
            })
        }

        {swapMatches.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="list-meta" style={{ marginBottom: 8 }}>Your duplicates that friends need</div>
            {swapMatches.map(m => (
              <div key={m.name} className="swap-match-row">
                <div className="swap-match-header">
                  <span className="swap-match-name">{m.name}</span>
                  <span className="badge-gold">needs {m.stickers.length} of your dupes</span>
                </div>
                <div className="missing-pills" style={{ marginTop: 6 }}>
                  {m.stickers.slice(0, 16).map(s => <span key={s} className="missing-pill">{s}</span>)}
                  {m.stickers.length > 16 && <span className="missing-pill">+{m.stickers.length - 16} more</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const { album, dupes, toggleAlbum, promoteToAlbum, addDupe, removeDupe, bulkAdd, resetAll } = useStore();
  const { room, members, loading, error, memberId, createRoom, joinRoom, sync, leaveRoom, fetchMembers } = useRoom();

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('album');
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(null);
  const [promoteId, setPromoteId] = useState(null); // sticker ID pending promote modal

  // Sync to room whenever album/dupes change
  useEffect(() => { sync(album, dupes); }, [album, dupes]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Cell tap → may trigger promote modal
  const handleCellTap = useCallback((id) => {
    const result = toggleAlbum(id);
    if (result === 'has-dupes') {
      setPromoteId(id); // show modal
    } else if (result === 'added') {
      showToast(`${id} added to album ✅`);
    } else {
      showToast(`${id} removed from album`, 'neutral');
    }
  }, [toggleAlbum, showToast]);

  const handlePromote = useCallback(() => {
    if (!promoteId) return;
    promoteToAlbum(promoteId);
    showToast(`${promoteId} moved from dupes to album ✅`);
    setPromoteId(null);
  }, [promoteId, promoteToAlbum, showToast]);

  const handleDismissPromote = useCallback(() => {
    setPromoteId(null);
  }, []);

  const handleBulkAdd = () => {
    const { album: addedToAlbum, dupes: addedToDupes, notFound } = bulkAdd(input);
    if (addedToAlbum.length) showToast(`${addedToAlbum.length} added to album ✅`);
    if (addedToDupes.length) showToast(`${addedToDupes.length} added to duplicates pile 📦`, 'gold');
    if (notFound.length) showToast(`Not found: ${notFound.join(', ')}`, 'error');
    if (addedToAlbum.length || addedToDupes.length) setInput('');
  };

  const stats = useMemo(() => {
    const have = album.size;
    const totalDupes = [...dupes.values()].reduce((s, c) => s + c, 0);
    return { have, totalDupes, missing: TOTAL_STICKERS - have };
  }, [album, dupes]);

  const filteredTeams = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return TEAMS;
    return TEAMS.filter(t => t.name.toLowerCase().includes(q) || (t.group || '').toLowerCase().includes(q));
  }, [search]);

  const dupesCount = dupes.size;

  const TABS = [
    { key: 'album', label: '📖 Album' },
    { key: 'swaps', label: `🔄 Swaps (${dupesCount})` },
    { key: 'missing', label: `📋 Missing (${stats.missing})` },
    { key: 'share', label: `👥 Share${room ? ` · ${room.code}` : ''}` },
  ];

  return (
    <div className="app">
      <PromoteModal stickerId={promoteId} onPromote={handlePromote} onDismiss={handleDismissPromote} />

      <header className="header">
        <div>
          <h1 className="logo">⚽ WC 2026 Sticker Tracker</h1>
          <p className="logo-sub">Physical Album · Panini Official Collection</p>
        </div>
        <button className="btn-reset" onClick={() => { if (confirm('Reset everything?')) { resetAll(); showToast('Collection reset', 'neutral'); } }}>Reset</button>
      </header>

      {/* Global progress */}
      <div className="progress-card">
        <div className="progress-big">{stats.have}<span className="progress-of">/{TOTAL_STICKERS}</span></div>
        <div className="progress-right">
          <div className="progress-pct">{Math.round((stats.have / TOTAL_STICKERS) * 100)}% complete</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(stats.have / TOTAL_STICKERS) * 100}%` }} />
          </div>
          <div className="chips">
            <span className="chip chip-dim">❌ {stats.missing} missing</span>
            <span className="chip chip-gold">📦 {stats.totalDupes} duplicates</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Album tab */}
      {tab === 'album' && (
        <>
          <div className="add-row">
            <input
              className="text-input"
              placeholder="Add stickers: SUI-15, ARG-3, USA-7…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBulkAdd()}
            />
            <button className="btn-primary" onClick={handleBulkAdd}>+ Add</button>
          </div>
          <div className="controls">
            <input className="text-input search" placeholder="Search team or group…" value={search} onChange={e => setSearch(e.target.value)} />
            <div className="filters">
              {['all', 'have', 'missing', 'dupes'].map(f => (
                <button key={f} className={`flt ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : f === 'have' ? '✅ Have' : f === 'missing' ? '❌ Missing' : '📦 Dupes'}
                </button>
              ))}
            </div>
          </div>
          {filteredTeams.map(team => (
            <Section key={team.id} team={team} album={album} dupes={dupes} onCellTap={handleCellTap} filter={filter} />
          ))}
        </>
      )}

      {tab === 'swaps' && <SwapsTab dupes={dupes} onRemoveDupe={removeDupe} />}
      {tab === 'missing' && <MissingTab album={album} missingCount={stats.missing} />}
      {tab === 'share' && (
        <ShareTab
          album={album} dupes={dupes}
          room={room} members={members} loading={loading} error={error} memberId={memberId}
          createRoom={createRoom} joinRoom={joinRoom} leaveRoom={leaveRoom} fetchMembers={fetchMembers}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}
