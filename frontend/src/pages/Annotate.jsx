import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar.jsx';
import { useToast } from '../components/Toast.jsx';
import { BASE_URL, API_ENDPOINTS } from '../utils/constants.js';
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Music,
  SendHorizontal,
  LockOpen,
  FileText,
} from 'lucide-react';

export default function Annotate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [songData, setSongData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [proposedLyrics, setProposedLyrics] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setFetchError('');

        const [profileResponse, songResponse] = await Promise.all([
          axios.get(`${BASE_URL}${API_ENDPOINTS.PROFILE}`, { withCredentials: true }),
          axios.get(`${BASE_URL}${API_ENDPOINTS.SONGS}${id}/`, { withCredentials: true }),
        ]);

        const user = profileResponse.data;
        const song = songResponse.data;

        if (song.status !== 'PENDING') {
          throw new Error('This song is not currently accepting annotations.');
        }

        if (song.author === user.id) {
          throw new Error('You cannot annotate your own song. Use the Manage Annotations page to review contributions.');
        }

        setCurrentUser(user);
        setSongData(song);
        setProposedLyrics(song.original_lyrics || '');
      } catch (error) {
        console.error('Failed to load annotation workspace:', error);
        if (error.response?.status === 401) {
          navigate('/login');
          return;
        }
        setFetchError(error.message || 'Unable to load this annotation workspace.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleSubmit = async () => {
    if (!proposedLyrics.trim()) {
      addToast({ type: 'error', title: 'Lyrics required', description: 'Please add your proposed lyrics before submitting.' });
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        `${BASE_URL}${API_ENDPOINTS.ANNOTATION_REQUESTS}`,
        {
          song: id,
          proposed_lyrics: proposedLyrics.trim(),
          note: note.trim(),
        },
        { withCredentials: true },
      );

      setSubmitted(true);
      addToast({
        type: 'success',
        title: 'Annotation request sent!',
        description: 'The song author will review your proposed changes.',
      });
    } catch (error) {
      console.error('Failed to submit annotation request:', error);
      const description =
        error.response?.data?.error || 'Unable to submit your annotation request right now.';
      addToast({ type: 'error', title: 'Submission failed', description });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] font-sans flex flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center text-slate-500">
          <LoaderCircle size={24} className="animate-spin" />
        </div>
      </div>
    );
  }

  /* ── Error / Not eligible ── */
  if (fetchError || !songData) {
    return (
      <div className="min-h-screen bg-[#fafafa] font-sans flex flex-col">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full mt-20">
          <div className="bg-white/80 border border-slate-200/60 rounded-[2rem] p-10 shadow-sm text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Unable to open annotation workspace</h1>
            <p className="text-slate-500 mb-6">{fetchError}</p>
            <Link to="/explore" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
              <ArrowLeft size={16} /> Back to Explore
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Submitted success state ── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fafafa] font-sans flex flex-col">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 w-full mt-24">
          <div className="bg-white/80 border border-slate-200/60 rounded-[2rem] p-12 shadow-sm text-center">
            <div className="w-20 h-20 bg-emerald-50 border-4 border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Annotation request sent!</h1>
            <p className="text-slate-500 text-sm mb-8">
              Your proposed changes have been sent to <strong>{songData.author_username}</strong> for review.
              You'll know when they accept or reject your contribution.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/explore" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
                <ArrowLeft size={16} /> Back to Explore
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main editor ── */
  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 font-sans pb-24 relative flex flex-col">
      <Navbar />

      {/* Blurred background blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40" />
        <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-violet-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-30" />
      </div>

      {/* Sticky header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-slate-200/60 py-4 mb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link to="/explore" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <span className="text-xs font-medium text-slate-500">Annotating</span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {songData.title}
                <span className="ml-2 text-sm font-semibold text-slate-500">by {songData.author_username}</span>
              </h1>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-700">
            <LockOpen size={12} /> Open for Annotation
          </span>

        </div>
      </div>

      {/* Two-column layout */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 w-full flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main editor — left column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Instructions banner */}
            <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 text-indigo-900">
              <FileText size={18} className="mt-0.5 flex-shrink-0 text-indigo-500" />
              <p className="text-sm font-medium leading-relaxed">
                The original lyrics are pre-filled below. Edit them however you think they should read, then click <strong>Save Contribution</strong>. The author will review your changes.
              </p>
            </div>

            {/* Lyrics textarea */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-grow min-h-[520px]">
              {/* Editor toolbar */}
              <div className="border-b border-slate-200/60 bg-slate-50/50 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music size={15} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proposed Lyrics</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {proposedLyrics.split('\n').filter(Boolean).length} lines
                </span>
              </div>

              <textarea
                value={proposedLyrics}
                onChange={(e) => setProposedLyrics(e.target.value)}
                className="w-full flex-grow p-6 bg-transparent resize-none focus:outline-none text-slate-800 text-lg leading-relaxed placeholder-slate-300 font-medium"
                placeholder="Edit the song lyrics here..."
                spellCheck
              />
            </div>
          </div>

          {/* Sidebar — right column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Note to author */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-6 shadow-sm">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Note to Author <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                rows={5}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explain your changes, e.g. 'Fixed a spelling error in line 3' or 'Suggested a better rhyme for the chorus'..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              />
            </div>

            {/* Song info card */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-6 shadow-sm text-sm text-slate-600 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Song Info</p>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Title</span>
                <span className="font-semibold text-slate-800">{songData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Author</span>
                <span className="font-semibold text-slate-800">{songData.author_username}</span>
              </div>
              {songData.genre_display && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Genre</span>
                  <span className="font-semibold text-slate-800">{songData.genre_display}</span>
                </div>
              )}
              {songData.original_language_display && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Language</span>
                  <span className="font-semibold text-slate-800">{songData.original_language_display}</span>
                </div>
              )}
            </div>

            {/* Submit button (also in sidebar for convenience) */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !proposedLyrics.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 disabled:bg-slate-400 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold shadow-md transition-all disabled:cursor-not-allowed"
            >
              {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <SendHorizontal size={16} />}
              {submitting ? 'Submitting...' : 'Save Contribution'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}