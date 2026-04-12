import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar.jsx';
import { useToast } from '../components/Toast.jsx';
import { BASE_URL, API_ENDPOINTS } from '../utils/constants.js';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock3,
  BookOpenText,
  LockOpen,
  LoaderCircle,
  User,
  ChevronDown,
  ChevronUp,
  GitMerge,
} from 'lucide-react';

const STATUS_STYLES = {
  pending:           'bg-amber-50 text-amber-700 border border-amber-200',
  accepted:          'bg-emerald-50 text-emerald-700 border border-emerald-200',
  partially_accepted:'bg-sky-50 text-sky-700 border border-sky-200',
  rejected:          'bg-rose-50 text-rose-700 border border-rose-200',
};
const STATUS_LABELS = {
  pending:            'Pending',
  accepted:           'Accepted',
  partially_accepted: 'Partially Accepted',
  rejected:           'Rejected',
};

/**Line-by-line LCS diff*/
function computeLineDiff(original, proposed) {
  const a = (original || '').split('\n');
  const b = (proposed || '').split('\n');
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const result = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1]) { result.unshift({ type:'equal',   line: a[i-1] }); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) { result.unshift({ type:'added',   line: b[j-1] }); j--; }
    else { result.unshift({ type:'removed', line: a[i-1] }); i--; }
  }
  return result;
}

/** Group consecutive changed lines into chunks */
function groupIntoHunks(diff) {
  const hunks = [];
  let currentHunk = null;

  diff.forEach((entry, idx) => {
    if (entry.type === 'equal') {
      if (currentHunk) { hunks.push(currentHunk); currentHunk = null; }
    } else {
      if (!currentHunk) currentHunk = { id: hunks.length, startIdx: idx, lines: [] };
      currentHunk.lines.push({ ...entry, diffIdx: idx });
    }
  });
  if (currentHunk) hunks.push(currentHunk);
  return hunks;
}


function applySelectedHunks(diff, hunks, selectedHunkIds, editedHunks = {}) {
  const selectedSet = new Set(selectedHunkIds);
  const diffIdxToHunk = new Map();
  hunks.forEach(h => h.lines.forEach(l => diffIdxToHunk.set(l.diffIdx, h.id)));
  const result = [];
  const seen = new Set();
  diff.forEach((entry, idx) => {
    if (entry.type === 'equal') { result.push(entry.line); return; }
    const hunkId = diffIdxToHunk.get(idx);
    if (seen.has(`${hunkId}-done`)) return;
    const hunk = hunks.find(h => h.id === hunkId);
    if (!hunk) return;
    if (!seen.has(`${hunkId}-start`)) {
      seen.add(`${hunkId}-start`);
      if (selectedSet.has(hunkId)) {
        if (editedHunks[hunkId] !== undefined) {
          if (editedHunks[hunkId] !== '') {
            result.push(...editedHunks[hunkId].split('\n'));
          }
        } else {
          hunk.lines.forEach(l => { if (l.type === 'added') result.push(l.line); });
        }
      } else {
        hunk.lines.forEach(l => { if (l.type === 'removed') result.push(l.line); });
      }
      seen.add(`${hunkId}-done`);
    }
  });

  return result.join('\n');
}

const CONTEXT = 2;
function SelectiveDiffView({ original, proposed, selectedHunkIds, onToggleHunk }) {
  const diff = useMemo(() => computeLineDiff(original || '', proposed || ''), [original, proposed]);
  const hunks = useMemo(() => groupIntoHunks(diff), [diff]);

  const visibleIdxSet = useMemo(() => {
    const changedIdx = new Set();
    diff.forEach((d, i) => { if (d.type !== 'equal') changedIdx.add(i); });
    const visible = new Set();
    changedIdx.forEach(idx => {
      for (let k = Math.max(0, idx - CONTEXT); k <= Math.min(diff.length - 1, idx + CONTEXT); k++)
        visible.add(k);
    });
    return visible;
  }, [diff]);
  const diffIdxToHunk = useMemo(() => {
    const map = new Map();
    hunks.forEach(h => h.lines.forEach(l => map.set(l.diffIdx, h.id)));
    return map;
  }, [hunks]);

  if (hunks.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic px-2 py-3">
        No differences — proposed lyrics are identical to the original.
      </p>
    );
  }
  const rowStyle = {
    equal:   'bg-transparent text-slate-600',
    removed: 'bg-rose-50 text-rose-800',
    added:   'bg-emerald-50 text-emerald-900',
  };
  const prefix = { equal: ' ', removed: '−', added: '+' };

  const rows = [];
  let prevVisible = true;
  diff.forEach((d, i) => {
    if (!visibleIdxSet.has(i)) {
      if (prevVisible) rows.push({ type: 'separator', key: `sep-${i}` });
      prevVisible = false;
      return;
    }
    prevVisible = true;
    const hunkId = diffIdxToHunk.get(i);
    const isFirst = d.type !== 'equal' && hunks.find(h => h.id === hunkId)?.lines[0]?.diffIdx === i;
    rows.push({ ...d, key: i, hunkId, isFirst });
  });

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden font-mono text-sm divide-y divide-slate-100">
      {rows.map(row => {
        if (row.type === 'separator') {
          return (
            <div key={row.key} className="px-3 py-0.5 bg-slate-100 text-slate-400 text-xs select-none">···</div>
          );
        }

        const isChanged = row.type !== 'equal';
        const isSelected = selectedHunkIds.has(row.hunkId);

        return (
          <div
            key={row.key}
            className={`flex items-start gap-2 px-3 py-1 leading-6 ${rowStyle[row.type]} ${isChanged && row.isFirst ? 'border-l-4' : isChanged ? 'border-l-4 border-transparent' : ''} ${row.type === 'removed' && row.isFirst ? 'border-rose-400' : ''} ${row.type === 'added' && row.isFirst ? 'border-emerald-400' : ''} ${isChanged && !row.isFirst ? (row.type === 'removed' ? 'border-l-4 border-rose-200' : 'border-l-4 border-emerald-200') : ''}`}
          >
            <div className="w-5 shrink-0 flex items-center justify-center mt-1">
              {isChanged && row.isFirst ? (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleHunk(row.hunkId)}
                  className="w-3.5 h-3.5 accent-slate-900 cursor-pointer"
                  title={isSelected ? 'Deselect this change' : 'Select this change'}
                />
              ) : (
                <span className="select-none text-[10px] font-bold opacity-40">{prefix[row.type]}</span>
              )}
            </div>

            <span className={`whitespace-pre-wrap break-all ${isChanged && !isSelected && row.type === 'added' ? 'opacity-35' : ''}`}>
              {row.line || <span className="opacity-30">↵</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AnnotationCard({ annotation, song, onRemove, addToast }) {
  const [reviewing, setReviewing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const diff = useMemo(
    () => computeLineDiff(song?.original_lyrics || '', annotation.proposed_lyrics || ''),
    [song?.original_lyrics, annotation.proposed_lyrics],
  );
  const hunks = useMemo(() => groupIntoHunks(diff), [diff]);
  const [selectedHunkIds, setSelectedHunkIds] = useState(() => new Set(hunks.map(h => h.id)));
  const [editedHunks, setEditedHunks] = useState({});
  useEffect(() => {
    setSelectedHunkIds(new Set(hunks.map(h => h.id)));
    setEditedHunks({});
  }, [hunks.length]);

  const toggleHunk = useCallback((hunkId) => {
    setSelectedHunkIds(prev => {
      const next = new Set(prev);
      next.has(hunkId) ? next.delete(hunkId) : next.add(hunkId);
      return next;
    });
  }, []);

  const handleChangeHunkText = useCallback((hunkId, text) => {
    setEditedHunks(prev => ({ ...prev, [hunkId]: text }));
    setSelectedHunkIds(prev => {
      if (!prev.has(hunkId)) { const n = new Set(prev); n.add(hunkId); return n; }
      return prev;
    });
  }, []);

  const selectAll   = () => setSelectedHunkIds(new Set(hunks.map(h => h.id)));
  const deselectAll = () => setSelectedHunkIds(new Set());

  const mergedLyrics = useMemo(
    () => applySelectedHunks(diff, hunks, selectedHunkIds, editedHunks),
    [diff, hunks, selectedHunkIds, editedHunks],
  );

  const allSelected  = selectedHunkIds.size === hunks.length;
  const noneSelected = selectedHunkIds.size === 0;
  const isPartial    = !allSelected && !noneSelected;

  const handleApply = async () => {
    if (noneSelected) {
      await handleReject();
      return;
    }
    setReviewing(true);
    try {
      const isAnyHunkEdited = Object.keys(editedHunks).length > 0;
      const finalStatus = (allSelected && !isAnyHunkEdited) ? 'accepted' : 'partially_accepted';
      
      await axios.post(
        `${BASE_URL}${API_ENDPOINTS.ANNOTATION_REQUEST_PARTIAL_REVIEW(annotation.id)}`,
        { applied_lyrics: mergedLyrics, status: finalStatus },
        { withCredentials: true },
      );

      onRemove(annotation.id);
      addToast({
        type: 'success',
        title: (allSelected && !isAnyHunkEdited) ? 'All changes accepted' : 'Selected changes applied',
        description: (allSelected && !isAnyHunkEdited)
          ? 'All proposed changes have been applied to your song.'
          : isAnyHunkEdited
            ? 'Your manual edits have been applied successfully.'
            : `${selectedHunkIds.size} of ${hunks.length} change${hunks.length !== 1 ? 's' : ''} applied to your song.`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Apply failed', description: err.response?.data?.error || 'Unable to apply changes right now.' });
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async () => {
    setReviewing(true);
    try {
      await axios.post(
        `${BASE_URL}${API_ENDPOINTS.ANNOTATION_REQUEST_REVIEW(annotation.id)}`,
        { status: 'rejected' },
        { withCredentials: true },
      );
      onRemove(annotation.id);
      addToast({ type: 'success', title: 'Annotation rejected', description: 'The annotation request has been rejected.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Reject failed', description: err.response?.data?.error || 'Unable to reject right now.' });
    } finally {
      setReviewing(false);
    }
  };

  const isPending = annotation.status === 'pending';

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <User size={15} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{annotation.contributor_username}</p>
            <p className="text-xs text-slate-400">
              {new Date(annotation.created_at).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${STATUS_STYLES[annotation.status] || STATUS_STYLES.pending}`}>
          {STATUS_LABELS[annotation.status] || annotation.status}
        </span>
      </div>

      {/* Note */}
      {annotation.note && (
        <div className="mb-4 bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Note from contributor</p>
          <p className="text-sm text-slate-700 leading-relaxed">{annotation.note}</p>
        </div>
      )}

      {/* Edit chunk */}
      {isPending && hunks.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Edit Changes</p>
              <span className="text-xs font-semibold text-slate-400">
                {selectedHunkIds.size} / {hunks.length} selected
              </span>
            </div>
            {hunks.length > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={selectAll}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
                >
                  All
                </button>
                <button
                  onClick={deselectAll}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
                >
                  None
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {hunks.map((hunk, idx) => {
              const removedLines = hunk.lines.filter(l => l.type === 'removed').map(l => l.line);
              const addedLines   = hunk.lines.filter(l => l.type === 'added').map(l => l.line);
              const isSelected   = selectedHunkIds.has(hunk.id);
              const currentText  = editedHunks[hunk.id] !== undefined ? editedHunks[hunk.id] : addedLines.join('\n');
              
              return (
                <div key={hunk.id} className={`border rounded-[1rem] overflow-hidden transition-all ${isSelected ? 'border-indigo-200 shadow-sm' : 'border-slate-200 opacity-70'}`}>
                  <div className={`flex items-center gap-2 px-3 py-2 border-b ${isSelected ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-100 border-slate-200'}`}>
                    <input 
                      type="checkbox" 
                      onChange={() => toggleHunk(hunk.id)} 
                      checked={isSelected}
                      className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                    />
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                      Change {idx + 1}
                    </span>
                  </div>                  
                  <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white">
                    <div className="flex-1 p-3">
                      <p className="text-[10px] font-bold text-rose-500/70 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <span className="text-xl leading-none -mt-0.5">−</span> Original
                      </p>
                      {removedLines.length > 0 ? (
                        <div className="text-sm font-mono text-rose-900 whitespace-pre-wrap break-words leading-relaxed pl-2 border-l-2 border-rose-200">
                          {removedLines.join('\n')}
                        </div>
                      ) : (
                        <p className="text-xs italic text-slate-400 pl-2">No lines replaced (this is an addition)</p>
                      )}
                    </div>
                    
                    <div className="flex-1 p-3 bg-emerald-50/30">
                      <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <span className="text-lg leading-none -mt-0.5">+</span> Proposed <span className="lowercase text-[9px] font-medium text-slate-400 ml-1">(editable)</span>
                      </p>
                      <textarea
                        value={currentText}
                        onChange={(e) => handleChangeHunkText(hunk.id, e.target.value)}
                        className="w-full min-h-[60px] h-full text-sm font-mono text-emerald-950 bg-transparent border-none p-0 resize-y focus:ring-0 focus:outline-none leading-relaxed pl-2 border-l-2 border-emerald-300 transition-all placeholder:text-emerald-200"
                        placeholder="Leave blank to remove these lines completely"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isPending && (
        <div className="mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Changes (read-only)</p>
          <SelectiveDiffView
            original={song?.original_lyrics || ''}
            proposed={annotation.proposed_lyrics}
            selectedHunkIds={new Set()}
            onToggleHunk={() => {}}
          />
        </div>
      )}

      {isPending && hunks.length > 0 && (
        <div className="mb-4 bg-white border border-slate-200 rounded-[1rem] overflow-hidden">
          <button
            onClick={() => setShowPreview(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
              {showPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Preview Final Song
              {isPartial && (
                <span className="ml-1 text-[10px] text-sky-600 font-semibold normal-case">(partial)</span>
              )}
              {Object.keys(editedHunks).length > 0 && (
                <span className="ml-1 text-[10px] text-amber-600 font-semibold normal-case">(edited)</span>
              )}
            </div>
          </button>
          
          {showPreview && (
            <div className="p-4 border-t border-slate-100 bg-white">
              <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-700 font-sans max-h-64 overflow-y-auto">
                {mergedLyrics || <span className="text-slate-400 italic">Song is entirely empty</span>}
              </pre>
            </div>
          )}
        </div>
      )}

      {isPending && (
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={handleApply}
            disabled={reviewing}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {reviewing ? <LoaderCircle size={14} className="animate-spin" /> : <GitMerge size={15} />}
            {Object.keys(editedHunks).length > 0
               ? 'Apply Edits' 
               : noneSelected 
                 ? 'Reject All' 
                 : allSelected 
                   ? 'Accept All' 
                   : `Apply ${selectedHunkIds.size} Change${selectedHunkIds.size !== 1 ? 's' : ''}`}
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={reviewing}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {reviewing ? <LoaderCircle size={14} className="animate-spin" /> : <XCircle size={15} />}
            Reject All
          </button>
        </div>
      )}
      {annotation.reviewed_at && (
        <p className="text-xs text-slate-400 mt-3">
          Reviewed on{' '}
          {new Date(annotation.reviewed_at).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: 'numeric', minute: '2-digit',
          })}
        </p>
      )}
    </div>
  );
}


export default function ManageAnnotations() {
  const { songId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [song, setSong] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setFetchError('');

        const [profileResponse, songResponse] = await Promise.all([
          axios.get(`${BASE_URL}${API_ENDPOINTS.PROFILE}`, { withCredentials: true }),
          axios.get(`${BASE_URL}${API_ENDPOINTS.SONGS}${songId}/`, { withCredentials: true }),
        ]);

        const user = profileResponse.data;
        const songInfo = songResponse.data;

        if (songInfo.author !== user.id) {
          setFetchError('Only the song author can view and manage annotation requests.');
          setLoading(false);
          return;
        }

        setSong(songInfo);

        const annotationsResponse = await axios.get(
          `${BASE_URL}${API_ENDPOINTS.ANNOTATION_REQUESTS}?song=${songId}`,
          { withCredentials: true },
        );
        setAnnotations(annotationsResponse.data);
      } catch (error) {
        console.error('Failed to load manage annotations page:', error);
        if (error.response?.status === 401) { navigate('/login'); return; }
        setFetchError('Unable to load the annotation review workspace.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, songId]);

  const annotationStats = useMemo(() => ({
    total:    annotations.length,
    pending:  annotations.filter(a => a.status === 'pending').length,
    accepted: annotations.filter(a => a.status === 'accepted' || a.status === 'partially_accepted').length,
  }), [annotations]);

  const handleRemove = useCallback((id) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 font-sans pb-24 relative flex flex-col">
      <Navbar />

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40" />
        <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-violet-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/annotations" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manage Annotations</h1>
            <p className="text-slate-500 mt-1">Review contributor submissions and decide what to accept.</p>
          </div>
        </div>

        {fetchError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {fetchError}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-72 text-slate-400">
            <LoaderCircle size={28} className="animate-spin" />
          </div>
        ) : song ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 shadow-sm">
                <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 border border-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-700">
                  <LockOpen size={13} /> Open for Annotation
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-4">{song.title}</h2>
                <p className="text-sm text-slate-500 mt-2">By {song.author_username}</p>
                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={15} className="text-slate-400" />
                    {annotationStats.total} total contribution{annotationStats.total !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock3 size={15} className="text-slate-400" />
                    {annotationStats.pending} pending review
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-slate-400" />
                    {annotationStats.accepted} accepted
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpenText size={18} className="text-slate-400" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Original Lyrics</h3>
                </div>
                <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-700 max-h-64 overflow-y-auto">
                  {song.original_lyrics || 'No lyrics available.'}
                </pre>
              </div>
            </div>

            {/* Annotation cards */}
            <div className="lg:col-span-8">
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Contributor Annotation Requests
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">{annotationStats.total} items</span>
                </div>

                <div className="space-y-6">
                  {annotations.length ? (
                    annotations.map(annotation => (
                      <AnnotationCard
                        key={annotation.id}
                        annotation={annotation}
                        song={song}
                        onRemove={handleRemove}
                        addToast={addToast}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-500">
                      <MessageSquare size={32} className="mx-auto mb-3 text-slate-300" />
                      <p className="font-semibold text-slate-700 mb-1">No annotation requests yet</p>
                      <p className="text-sm">When other users annotate your song, their contributions will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}