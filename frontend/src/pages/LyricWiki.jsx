import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Search,
  BookOpen,
  ThumbsUp,
  Globe2,
  Quote,
  Sparkles,
  LoaderCircle,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  MessageSquare,
  User,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { API_ENDPOINTS, BASE_URL, LANGUAGES } from '../utils/constants';

const LANGUAGE_FILTERS = LANGUAGES;

const LANGUAGE_TINT = {
  en: 'bg-sky-50 text-sky-700 border border-sky-100',
  hi: 'bg-amber-50 text-amber-700 border border-amber-100',
  mr: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  ta: 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100',
  bn: 'bg-rose-50 text-rose-700 border border-rose-100',
};

// ── Contribution form component ─────────────────────────────────────────────
function ContributeForm({ wordId, onSuccess, onCancel }) {
  const [meaning, setMeaning] = useState('');
  const [culturalContext, setCulturalContext] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!meaning.trim()) {
      setError('Meaning is required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { data } = await axios.post(
        `${BASE_URL}${API_ENDPOINTS.WORD_CONTRIBUTIONS}`,
        { dictionary: wordId, meaning: meaning.trim(), cultural_context: culturalContext.trim() },
        { withCredentials: true }
      );
      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to submit. Please log in first.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-pink-50/60 border border-pink-100 rounded-2xl p-4 flex flex-col gap-3">
      <p className="text-sm font-bold text-slate-700">Add your interpretation</p>
      <textarea
        rows={2}
        placeholder="Your meaning or definition…"
        value={meaning}
        onChange={(e) => setMeaning(e.target.value)}
        className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400/30 focus:border-pink-400 resize-none bg-white text-slate-800 placeholder-slate-400"
      />
      <textarea
        rows={2}
        placeholder="Cultural context or significance (optional)…"
        value={culturalContext}
        onChange={(e) => setCulturalContext(e.target.value)}
        className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400/30 focus:border-pink-400 resize-none bg-white text-slate-800 placeholder-slate-400"
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-50 transition-colors"
        >
          {submitting ? <LoaderCircle size={14} className="animate-spin" /> : <Plus size={14} />}
          Submit
        </button>
      </div>
    </form>
  );
}

// ── Single contribution row ──────────────────────────────────────────────────
function ContributionRow({ contribution, onUpvote }) {
  const [upvotes, setUpvotes] = useState(contribution.upvotes);
  const [voted, setVoted] = useState(false);

  const handleUpvote = async () => {
    if (voted) return;
    try {
      const { data } = await axios.post(
        `${BASE_URL}${API_ENDPOINTS.WORD_CONTRIBUTION_UPVOTE(contribution.id)}`,
        {},
        { withCredentials: true }
      );
      setUpvotes(data.upvotes);
      setVoted(true);
      onUpvote?.(contribution.id, data.upvotes);
    } catch {
      // silently ignore
    }
  };

  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-slate-100 last:border-0">
      <p className="text-sm text-slate-700 font-medium leading-relaxed">{contribution.meaning}</p>
      {contribution.cultural_context && (
        <p className="text-xs text-slate-500 italic leading-relaxed">
          <span className="font-semibold text-violet-600 not-italic">Cultural context: </span>
          {contribution.cultural_context}
        </p>
      )}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <User size={12} />
          <span>{contribution.contributor_username}</span>
        </div>
        <button
          type="button"
          onClick={handleUpvote}
          disabled={voted}
          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
            voted
              ? 'bg-pink-50 border-pink-200 text-pink-600'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600'
          }`}
        >
          <ThumbsUp size={12} />
          {upvotes}
        </button>
      </div>
    </div>
  );
}

// ── Word card ────────────────────────────────────────────────────────────────
function WordCard({ item, onSaveToggle }) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [contributions, setContributions] = useState(null); // null = not loaded yet
  const [loadingContributions, setLoadingContributions] = useState(false);
  const [contributionsCount, setContributionsCount] = useState(item.contributions_count ?? 0);
  const [isSaved, setIsSaved] = useState(item.is_saved ?? false);
  const [savingWord, setSavingWord] = useState(false);

  const loadContributions = useCallback(async () => {
    if (contributions !== null) return; // already loaded
    setLoadingContributions(true);
    try {
      const { data } = await axios.get(
        `${BASE_URL}${API_ENDPOINTS.WORD_CONTRIBUTIONS}?word_id=${item.id}`,
        { withCredentials: true }
      );
      setContributions(Array.isArray(data) ? data : (data.results ?? []));
    } catch {
      setContributions([]);
    } finally {
      setLoadingContributions(false);
    }
  }, [contributions, item.id]);

  const handleExpand = () => {
    if (!expanded) loadContributions();
    setExpanded((v) => !v);
  };

  const handleContributionSuccess = (newContribution) => {
    setContributions((prev) => [newContribution, ...(prev ?? [])]);
    setContributionsCount((c) => c + 1);
    setShowForm(false);
    if (!expanded) setExpanded(true);
  };

  const handleSave = async () => {
    setSavingWord(true);
    try {
      if (isSaved) {
        await axios.delete(`${BASE_URL}${API_ENDPOINTS.DICTIONARY_UNSAVE(item.id)}`, { withCredentials: true });
        setIsSaved(false);
        onSaveToggle?.(item.id, false);
      } else {
        await axios.post(`${BASE_URL}${API_ENDPOINTS.DICTIONARY_SAVE(item.id)}`, {}, { withCredentials: true });
        setIsSaved(true);
        onSaveToggle?.(item.id, true);
      }
    } catch {
      // silently ignore (not logged in, etc.)
    } finally {
      setSavingWord(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-pink-100/40 hover:border-pink-200/60 transition-all duration-300 flex flex-col group">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 gap-3">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{item.word}</h2>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${LANGUAGE_TINT[item.languageCode] || 'bg-pink-50 text-pink-700 border border-pink-100'}`}>
            {item.displayLanguage}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={savingWord}
            title={isSaved ? 'Remove from saved' : 'Save this word'}
            className={`p-1.5 rounded-lg border transition-colors ${
              isSaved
                ? 'bg-violet-50 border-violet-200 text-violet-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600'
            }`}
          >
            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
        </div>
      </div>

      {/* Base meaning */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4 relative overflow-hidden">
        <Quote size={80} className="absolute -top-4 -left-4 text-slate-100 rotate-180" />
        <p className="relative z-10 text-slate-700 font-medium italic">{item.meaning}</p>
      </div>

      {/* Community contributions toggle */}
      <button
        type="button"
        onClick={handleExpand}
        className="flex items-center justify-between w-full text-sm font-semibold text-slate-500 hover:text-pink-600 transition-colors mb-1 group/expand"
      >
        <span className="flex items-center gap-2">
          <MessageSquare size={15} />
          {contributionsCount > 0
            ? `${contributionsCount} community interpretation${contributionsCount !== 1 ? 's' : ''}`
            : 'No community interpretations yet'}
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Expanded contributions list */}
      {expanded && (
        <div className="mt-2">
          {loadingContributions ? (
            <div className="flex justify-center py-4">
              <LoaderCircle size={18} className="animate-spin text-pink-400" />
            </div>
          ) : contributions && contributions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {contributions.map((c) => (
                <ContributionRow key={c.id} contribution={c} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-2 text-center">
              Be the first to add a meaning or cultural context.
            </p>
          )}
        </div>
      )}

      {/* Add contribution */}
      {showForm ? (
        <ContributeForm
          wordId={item.id}
          onSuccess={handleContributionSuccess}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-4 flex items-center gap-2 text-sm font-bold text-pink-500 hover:text-pink-700 transition-colors self-start"
        >
          <Plus size={15} />
          Add meaning / cultural context
        </button>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function LyricWiki() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLang, setActiveLang] = useState(LANGUAGE_FILTERS[0]?.code || 'en');
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'saved'
  const [wikiTerms, setWikiTerms] = useState([]);
  const [savedTerms, setSavedTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchWikiData = async () => {
      try {
        setLoading(true);
        setFetchError('');
        const { data } = await axios.get(`${BASE_URL}${API_ENDPOINTS.DICTIONARY}`, { withCredentials: true });
        setWikiTerms(Array.isArray(data) ? data : []);
      } catch {
        setFetchError('Unable to load the lyric wiki right now.');
      } finally {
        setLoading(false);
      }
    };
    fetchWikiData();
  }, []);

  const fetchSavedWords = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const { data } = await axios.get(`${BASE_URL}${API_ENDPOINTS.DICTIONARY_SAVED}`, { withCredentials: true });
      setSavedTerms(Array.isArray(data) ? data : []);
    } catch {
      setSavedTerms([]);
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'saved' && savedTerms.length === 0) {
      fetchSavedWords();
    }
  };

  const handleSaveToggle = useCallback((wordId, isSaved) => {
    if (!isSaved) {
      setSavedTerms((prev) => prev.filter((t) => t.id !== wordId));
    }
    // re-fetch saved list next time it's opened
  }, []);

  const enrichTerms = useCallback((terms) =>
    terms.map((term) => {
      const languageMeta = LANGUAGE_FILTERS.find((l) => l.code === term.language);
      return {
        ...term,
        displayLanguage: term.language_display || languageMeta?.label || term.language,
        languageCode: term.language,
      };
    }), []);

  const allEnriched = useMemo(() => enrichTerms(wikiTerms), [enrichTerms, wikiTerms]);
  const savedEnriched = useMemo(() => enrichTerms(savedTerms), [enrichTerms, savedTerms]);

  const sourceTerms = viewMode === 'saved' ? savedEnriched : allEnriched;

  const filteredTerms = useMemo(() => {
    return sourceTerms.filter((term) => {
      const matchesSearch =
        !searchQuery ||
        term.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.meaning.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLang = viewMode === 'saved' ? true : term.languageCode === activeLang;
      return matchesSearch && matchesLang;
    });
  }, [activeLang, searchQuery, sourceTerms, viewMode]);

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-pink-100 selection:text-pink-900 font-sans pb-24 relative flex flex-col">
      <Navbar />
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[40%] h-[40%] bg-pink-200/40 rounded-full mix-blend-multiply filter blur-[120px]" />
        <div className="absolute bottom-1/4 left-0 w-[50%] h-[30%] bg-violet-200/40 rounded-full mix-blend-multiply filter blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 w-full">
        {/* Page header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 border border-pink-100 text-pink-700 text-sm font-semibold mb-6 shadow-sm">
            <BookOpen size={16} />
            <span>Community Dictionary</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">LyricWiki</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mb-10">
            Discover cultural meanings and context behind lyrics — contributed by the community, for the world.
          </p>

          {/* Search */}
          <div className="w-full max-w-3xl">
            <div className="relative flex-grow group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search for a word, phrase, or meaning…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl text-base text-slate-900 placeholder-slate-400 shadow-md shadow-pink-100/20 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* View mode tabs + language filter */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => handleViewModeChange('all')}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                viewMode === 'all'
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50/50'
              }`}
            >
              All Words
            </button>
            <button
              onClick={() => handleViewModeChange('saved')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                viewMode === 'saved'
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50/50'
              }`}
            >
              <Bookmark size={14} />
              Saved Words
            </button>
          </div>

          {/* Language filter — only in "all" mode */}
          {viewMode === 'all' && (
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-max items-center gap-3">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-2">
                  <Globe2 size={16} /> Filter by Language:
                </span>
                {LANGUAGE_FILTERS.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => setActiveLang(language.code)}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                      activeLang === language.code
                        ? 'bg-pink-500 text-white shadow-md shadow-pink-200 transform scale-105'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50/50'
                    }`}
                  >
                    {language.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {fetchError && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {fetchError}
          </div>
        )}

        {/* Word grid */}
        {loading || (viewMode === 'saved' && loadingSaved) ? (
          <div className="py-24 flex items-center justify-center text-slate-500">
            <LoaderCircle size={24} className="animate-spin" />
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredTerms.length > 0 ? (
                filteredTerms.map((item) => (
                  <WordCard key={item.id} item={item} onSaveToggle={handleSaveToggle} />
                ))
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-pink-200 rounded-[2rem] bg-pink-50/30 backdrop-blur-sm">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-pink-100">
                    {viewMode === 'saved' ? (
                      <Bookmark size={32} className="text-violet-400" />
                    ) : (
                      <Search size={32} className="text-pink-400" />
                    )}
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                    {viewMode === 'saved' ? 'No saved words yet' : 'No terms found'}
                  </h3>
                  <p className="text-slate-500 max-w-md mb-6">
                    {viewMode === 'saved'
                      ? 'Bookmark words from the dictionary to find them here later.'
                      : "We couldn't find any terms for this combination."}
                  </p>
                  {viewMode === 'all' && searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="flex items-center gap-2 bg-pink-600 text-white hover:bg-pink-700 px-6 py-3 rounded-xl font-bold transition-colors shadow-md shadow-pink-200"
                    >
                      <Sparkles size={18} /> Clear Search
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
