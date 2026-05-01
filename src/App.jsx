import { useState, useMemo, useCallback, useEffect } from 'react';
import { TEAMS, TOTAL_STICKERS } from './data.js';
import { useStore, VARIANTS, VARIANT_COLORS } from './useStore.js';
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

// ── Variant Picker Modal ───────────────────────────────────────────────────
function VariantModal({ stickerId, currentVariant, onSelect, onDismiss }) {
  if (!stickerId) return null;
  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title" style={{marginBottom:4}}>Which variant is <span className="modal-id">{stickerId}</span>?</div>
        <div className="modal-sub">Select the border color of your sticker</div>
        <div className="variant-grid">
          {VARIANTS.map(v => {
            const vc = VARIANT_COLORS[v];
            return (
              <button
                key={v}
                className={`variant-btn ${currentVariant === v ? 'active' : ''}`}
                style={{ '--vbg': vc.bg, '--vborder': vc.border, '--vtext': vc.text }}
                onClick={() => onSelect(v)}
              >
                {vc.label}
              </button>
            );
          })}
        </div>
        <button className="modal-btn modal-btn-secondary" style={{marginTop:12,width:'100%'}} onClick={onDismiss}>Cancel</button>
      </div>
    </div>
  );
}

// ── Dupe Chip ──────────────────────────────────────────────────────────────
function DupeChip({ id, variantCounts, onRemove }) {
  return (
    <div className="dupe-chip-group">
      {Object.entries(variantCounts).map(([v, count]) => {
        const vc = VARIANT_COLORS[v] || VARIANT_COLORS.base;
        return (
          <div key={v} className="dupe-chip" style={{'--vbg':vc.bg,'--vborder':vc.border,'--vtext':vc.text}}>
            <span className="dupe-chip-id">{id}</span>
            <span className="dupe-chip-variant">{vc.label}</span>
            <span className="dupe-chip-count">×{count}</span>
            {onRemove && (
              <button className="dupe-chip-minus" onClick={() => { try { onRemove(id, v); } catch(e) {} }}>−</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────
function Section({ team, album, dupes, variants, onCellTap, onCellLongPress, filter, isComplete }) {
  const [open, setOpen] = useState(false);
  const stickers = useMemo(() => Array.from({ length: team.count }, (_, i) => i + 1), [team.count]);

  const have = useMemo(() => stickers.filter(n => album.has(`${team.id}-${n}`)).length, [stickers, album, team.id]);
  const pct = Math.round((have / team.count) * 100);

  // Auto-close when complete
  useEffect(() => {
    if (have === team.count && open) setOpen(false);
  }, [have, team.count]);

  const visible = useMemo(() => {
    try {
      return stickers.filter(n => {
        const id = `${team.id}-${n}`;
        const inAlbum = album.has(id);
        if (filter === 'all') return true;
        if (filter === 'have') return inAlbum;
        if (filter === 'missing') return !inAlbum;
        if (filter === 'dupes') return dupes.has(id);
        return true;
      });
    } catch { return stickers; }
  }, [stickers, album, dupes, team.id, filter]);

  if (filter !== 'all' && visible.length === 0) return null;

  const teamDupesList = useMemo(() => {
    try {
      return stickers
        .filter(n => dupes.has(`${team.id}-${n}`))
        .map(n => ({ id: `${team.id}-${n}`, variantCounts: dupes.get(`${team.id}-${n}`) || {} }));
    } catch { return []; }
  }, [stickers, dupes, team.id]);

  const teamDupesCount = useMemo(() =>
    teamDupesList.reduce((s, d) => s + Object.values(d.variantCounts).reduce((a,b)=>a+b,0), 0),
    [teamDupesList]
  );

  return (
    <div className={`section ${isComplete ? 'section-complete' : ''}`}>
      <div className="sec-hdr" onClick={() => setOpen(o => !o)}>
        <span className="sec-flag">{team.flag}</span>
        <span className="sec-name">{team.name}</span>
        {team.group && <span className="sec-group">Grp {team.group}</span>}
        {isComplete && <span className="sec-complete-badge">✓ Complete</span>}
        {teamDupesCount > 0 && <span className="sec-dupes-badge">+{teamDupesCount} dupes</span>}
        <div className="mini-track"><div className="mini-fill" style={{ width: `${pct}%` }} /></div>
        <span className="sec-stat"><b>{have}</b>/{team.count}</span>
        <span className={`chev ${open ? 'open' : ''}`}>▼</span>
      </div>

      {open && (
        <div className="sec-body">
          <div className="grid">
            {visible.map(n => {
              const id = `${team.id}-${n}`;
              const inAlbum = album.has(id);
              const variant = variants.get(id) || 'base';
              const vc = inAlbum ? VARIANT_COLORS[variant] : null;
              return (
                <div
                  key={n}
                  className={`cell ${inAlbum ? 'have' : ''}`}
                  style={inAlbum && variant !== 'base' ? {
                    background: vc.bg,
                    borderColor: vc.border,
                  } : {}}
                  onClick={() => { try { onCellTap(id); } catch(e) {} }}
                  onContextMenu={e => { e.preventDefault(); if (inAlbum) onCellLongPress(id); }}
                  title={`${id}${inAlbum ? ' — long press to change variant' : ''}`}
                >
                  <span className="cell-num" style={inAlbum && variant !== 'base' ? {color: vc.text} : {}}>{n}</span>
                  <span className="cell-label">{team.id}</span>
                  {inAlbum && variant !== 'base' && (
                    <span className="cell-variant" style={{color: vc.text}}>{VARIANT_COLORS[variant].label}</span>
                  )}
                </div>
              );
            })}
          </div>

          {teamDupesList.length > 0 && (
            <div className="team-dupes-row">
              <span className="team-dupes-label">Dupes:</span>
              <div className="team-dupes-list">
                {teamDupesList.map(({ id, variantCounts }) => (
                  <DupeChip key={id} id={id} variantCounts={variantCounts} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Swaps Tab ──────────────────────────────────────────────────────────────
function SwapsTab({ dupes, onRemoveDupe }) {
  const items = useMemo(() => {
    try {
      const list = [];
      TEAMS.forEach(team => {
        Array.from({ length: team.count }, (_, i) => i + 1).forEach(n => {
          const id = `${team.id}-${n}`;
          const variantCounts = dupes.get(id);
          if (variantCounts && Object.keys(variantCounts).length > 0) {
            list.push({ id, team, variantCounts });
          }
        });
      });
      return list;
    } catch { return []; }
  }, [dupes]);

  const totalDupes = useMemo(() =>
    items.reduce((s, i) => s + Object.values(i.variantCounts).reduce((a,b)=>a+b,0), 0),
    [items]
  );

  if (!items.length) return (
    <div className="empty-state">
      <div className="empty-icon">📦</div>
      <div>No duplicates yet — keep opening packs!</div>
    </div>
  );

  const byTeam = useMemo(() => {
    const map = new Map();
    items.forEach(item => {
      if (!map.has(item.team.id)) map.set(item.team.id, { team: item.team, items: [] });
      map.get(item.team.id).items.push(item);
    });
    return [...map.values()];
  }, [items]);

  return (
    <div className="list-pane">
      <div className="list-meta">{items.length} sticker types · {totalDupes} total extras to trade</div>
      {byTeam.map(({ team, items: teamItems }) => (
        <div key={team.id} className="swap-team-block">
          <div className="swap-team-header">
            <span>{team.flag}</span>
            <span className="swap-team-name">{team.name}</span>
          </div>
          <div className="swap-chips">
            {teamItems.map(({ id, variantCounts }) => (
              <DupeChip key={id} id={id} variantCounts={variantCounts} onRemove={onRemoveDupe} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Missing Tab ────────────────────────────────────────────────────────────
function MissingTab({ album, missingCount }) {
  const grouped = useMemo(() => {
    try {
      return TEAMS.map(team => ({
        ...team,
        missing: Array.from({ length: team.count }, (_, i) => i + 1)
          .filter(n => !album.has(`${team.id}-${n}`)),
      })).filter(t => t.missing.length > 0);
    } catch { return []; }
  }, [album]);

  const exportTxt = () => {
    const lines = grouped.map(t =>
      `${t.name}: ${t.missing.map(n => `${t.id}-${n}`).join(', ')}`
    );
    const text = `FIFA WC 2026 Missing Stickers (${missingCount} total)\n\n` + lines.join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = 'missing-stickers-wc2026.txt';
    a.click();
  };

  return (
    <div className="list-pane">
      <div className="list-meta" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span>{missingCount} stickers still needed</span>
        <button className="btn-export" onClick={exportTxt}>Export .txt</button>
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
    try {
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
        return { name: m.name, stickers: theyNeed };
      }).filter(m => m.stickers.length > 0);
    } catch { return []; }
  }, [members, myDupeIds, memberId]);

  if (!hasFirebase) return (
    <div className="share-card">
      <div className="share-title">Setup required</div>
      <p className="share-sub">Friend sharing needs a free Firebase database. Follow the steps in <code>README.md</code>.</p>
      <div className="code-block">VITE_FIREBASE_URL=https://your-project-default-rtdb.firebaseio.com</div>
    </div>
  );

  if (!room) return (
    <>
      <div className="share-card">
        <div className="share-title">Create a room</div>
        <p className="share-sub">Generate a code and share it with friends.</p>
        <div className="input-row">
          <input className="text-input" placeholder="Your name (e.g. Kiko)" value={myName} onChange={e => setMyName(e.target.value)} />
          <button className="btn-primary" disabled={!myName.trim() || loading} onClick={() => createRoom(myName.trim(), album, dupes)}>
            {loading ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
      <div className="share-card">
        <div className="share-title">Join a room</div>
        <div className="input-row" style={{flexWrap:'wrap',gap:8}}>
          <input className="text-input" placeholder="Your name" value={joinName} onChange={e => setJoinName(e.target.value)} style={{maxWidth:150}} />
          <input className="text-input mono" placeholder="WC-XXXX" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} style={{maxWidth:140}} maxLength={7} />
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
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div className="share-title" style={{marginBottom:0}}>Room: {room.code}</div>
          <button className="btn-ghost-sm" onClick={leaveRoom}>Leave</button>
        </div>
        <div className="room-code" onClick={() => { navigator.clipboard?.writeText(room.code); setCopied(true); setTimeout(()=>setCopied(false),2000); }}>
          {room.code} <span className="room-code-hint">{copied ? '✓ copied' : 'tap to copy'}</span>
        </div>
      </div>
      <div className="share-card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div className="share-title" style={{marginBottom:0}}>Members ({members.length})</div>
          <button className="btn-ghost-sm" onClick={() => fetchMembers(room.code)}>Refresh</button>
        </div>
        {members.length === 0
          ? <p className="share-sub">No one else yet — share the code!</p>
          : members.map(m => {
              const isMe = m.memberId === memberId;
              const ago = Math.round((Date.now() - (m.updated||0)) / 60000);
              return (
                <div key={m.memberId} className="member-row">
                  <div className={`member-dot ${ago>10?'offline':''}`} />
                  <span className="member-name">{m.name}{isMe?' (you)':''}</span>
                  <span className="member-stat">{(m.album||[]).length}/{TOTAL_STICKERS} · {ago<2?'just now':`${ago}m ago`}</span>
                </div>
              );
            })
        }
        {swapMatches.length > 0 && (
          <div style={{marginTop:16}}>
            <div className="list-meta" style={{marginBottom:8}}>Your dupes that friends need</div>
            {swapMatches.map(m => (
              <div key={m.name} className="swap-match-row">
                <div className="swap-match-header">
                  <span className="swap-match-name">{m.name}</span>
                  <span className="badge-gold">needs {m.stickers.length}</span>
                </div>
                <div className="missing-pills" style={{marginTop:6}}>
                  {m.stickers.slice(0,16).map(s => <span key={s} className="missing-pill">{s}</span>)}
                  {m.stickers.length > 16 && <span className="missing-pill">+{m.stickers.length-16}</span>}
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
  const { album, dupes, variants, toggleAlbum, promoteToAlbum, addDupe, removeDupe, setVariant, bulkAdd, resetAll } = useStore();
  const { room, members, loading, error, memberId, createRoom, joinRoom, sync, leaveRoom, fetchMembers } = useRoom();

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('album');
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(null);
  const [promoteId, setPromoteId] = useState(null);
  const [variantPickerId, setVariantPickerId] = useState(null);

  useEffect(() => { try { sync(album, dupes); } catch {} }, [album, dupes]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleCellTap = useCallback((id) => {
    try {
      const result = toggleAlbum(id);
      if (result === 'has-dupes') setPromoteId(id);
      else if (result === 'added') showToast(`${id} added to album ✅`);
      else showToast(`${id} removed`, 'neutral');
    } catch(e) { console.error(e); }
  }, [toggleAlbum, showToast]);

  const handleCellLongPress = useCallback((id) => {
    setVariantPickerId(id);
  }, []);

  const handlePromote = useCallback(() => {
    try { promoteToAlbum(promoteId); showToast(`${promoteId} moved to album ✅`); } catch {}
    setPromoteId(null);
  }, [promoteId, promoteToAlbum, showToast]);

  const handleVariantSelect = useCallback((variant) => {
    try { setVariant(variantPickerId, variant); showToast(`${variantPickerId} set to ${VARIANT_COLORS[variant].label}`,'success'); } catch {}
    setVariantPickerId(null);
  }, [variantPickerId, setVariant, showToast]);

  const handleBulkAdd = () => {
    try {
      const { album: toAlbum, dupes: toDupes, notFound } = bulkAdd(input);
      if (toAlbum.length) showToast(`${toAlbum.length} added to album ✅`);
      if (toDupes.length) showToast(`${toDupes.length} added to dupes 📦`, 'gold');
      if (notFound.length) showToast(`Not found: ${notFound.join(', ')}`, 'error');
      if (toAlbum.length || toDupes.length) setInput('');
    } catch(e) { console.error(e); }
  };

  const handleRemoveDupe = useCallback((id, variant) => {
    try { removeDupe(id, variant); showToast(`${id} dupe removed`, 'neutral'); } catch(e) { console.error(e); }
  }, [removeDupe, showToast]);

  const stats = useMemo(() => {
    try {
      const have = album.size;
      const totalDupes = [...dupes.values()].reduce((s, entry) =>
        s + Object.values(entry).reduce((a,b)=>a+b,0), 0);
      return { have, totalDupes, missing: TOTAL_STICKERS - have };
    } catch { return { have: 0, totalDupes: 0, missing: TOTAL_STICKERS }; }
  }, [album, dupes]);

  // Sort: incomplete teams first, complete teams at bottom
  const sortedTeams = useMemo(() => {
    try {
      const q = search.toLowerCase();
      const filtered = TEAMS.filter(t =>
        !q || t.name.toLowerCase().includes(q) || (t.group||'').toLowerCase().includes(q)
      );
      const incomplete = filtered.filter(t => {
        const have = Array.from({length:t.count},(_,i)=>i+1).filter(n=>album.has(`${t.id}-${n}`)).length;
        return have < t.count;
      });
      const complete = filtered.filter(t => {
        const have = Array.from({length:t.count},(_,i)=>i+1).filter(n=>album.has(`${t.id}-${n}`)).length;
        return have === t.count;
      });
      return [...incomplete, ...complete];
    } catch { return TEAMS; }
  }, [search, album]);

  const completedIds = useMemo(() => {
    try {
      return new Set(TEAMS.filter(t => {
        const have = Array.from({length:t.count},(_,i)=>i+1).filter(n=>album.has(`${t.id}-${n}`)).length;
        return have === t.count;
      }).map(t => t.id));
    } catch { return new Set(); }
  }, [album]);

  const dupesCount = dupes.size;

  const TABS = [
    { key:'album',   label:'📖 Album' },
    { key:'swaps',   label:`🔄 Swaps (${dupesCount})` },
    { key:'missing', label:`📋 Missing (${stats.missing})` },
    { key:'share',   label:`👥 Share${room?` · ${room.code}`:''}` },
  ];

  return (
    <div className="app">
      <PromoteModal stickerId={promoteId} onPromote={handlePromote} onDismiss={() => setPromoteId(null)} />
      <VariantModal stickerId={variantPickerId} currentVariant={variants.get(variantPickerId)||'base'} onSelect={handleVariantSelect} onDismiss={() => setVariantPickerId(null)} />

      <header className="header">
        <div>
          <h1 className="logo">WC 2026 Sticker Tracker</h1>
          <p className="logo-sub">Physical Album · Panini Official Collection</p>
        </div>
        <button className="btn-reset" onClick={() => { if (confirm('Reset everything?')) { resetAll(); showToast('Reset','neutral'); } }}>Reset</button>
      </header>

      <div className="progress-card">
        <div className="progress-big">{stats.have}<span className="progress-of">/{TOTAL_STICKERS}</span></div>
        <div className="progress-right">
          <div className="progress-pct">{Math.round((stats.have/TOTAL_STICKERS)*100)}% complete</div>
          <div className="progress-track"><div className="progress-fill" style={{width:`${(stats.have/TOTAL_STICKERS)*100}%`}} /></div>
          <div className="chips">
            <span className="chip chip-dim">❌ {stats.missing} missing</span>
            <span className="chip chip-gold">📦 {stats.totalDupes} duplicates</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.key} className={`tab ${tab===t.key?'active':''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === 'album' && (
        <>
          <div className="add-row">
            <input className="text-input" placeholder="Add: SUI-15, ARG-3, USA-7…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleBulkAdd()} />
            <button className="btn-primary" onClick={handleBulkAdd}>+ Add</button>
          </div>
          <div className="controls">
            <input className="text-input search" placeholder="Search team or group…" value={search} onChange={e=>setSearch(e.target.value)} />
            <div className="filters">
              {['all','have','missing','dupes'].map(f => (
                <button key={f} className={`flt ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
                  {f==='all'?'All':f==='have'?'✅ Have':f==='missing'?'❌ Missing':'📦 Dupes'}
                </button>
              ))}
            </div>
          </div>
          <div className="variant-legend">
            <span className="legend-label">Variants:</span>
            {VARIANTS.filter(v=>v!=='base').map(v => {
              const vc = VARIANT_COLORS[v];
              return <span key={v} className="legend-chip" style={{background:vc.bg,borderColor:vc.border,color:vc.text}}>{vc.label}</span>;
            })}
            <span className="legend-hint">Right-click a sticker to set variant</span>
          </div>
          {sortedTeams.map(team => (
            <Section
              key={team.id}
              team={team}
              album={album}
              dupes={dupes}
              variants={variants}
              onCellTap={handleCellTap}
              onCellLongPress={handleCellLongPress}
              filter={filter}
              isComplete={completedIds.has(team.id)}
            />
          ))}
        </>
      )}

      {tab === 'swaps' && <SwapsTab dupes={dupes} onRemoveDupe={handleRemoveDupe} />}
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
