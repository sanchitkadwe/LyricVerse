import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar.jsx';
import { API_ENDPOINTS, BASE_URL } from '../utils/constants';
import { MessageSquare, ArrowRight, Search, Clock3, ArrowLeft, LockOpen } from 'lucide-react';
import { getStoredAnnotations } from '../utils/annotationStore.js';

export default function Annotations() {
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        setFetchError('');
        const response = await axios.get(`${BASE_URL}${API_ENDPOINTS.MY_SONGS}`, {
          withCredentials: true,
        });

        const openSongs = response.data.filter((song) => song.status === 'PENDING');
        setSongs(openSongs);
      } catch (error) {
        console.error('Failed to load annotation songs:', error);
        if (error.response?.status === 401) {
          navigate('/login');
          return;
        }
        setFetchError('Unable to load your songs that are open for annotations.');
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [navigate]);

  const filteredSongs = useMemo(() => {
    return songs
      .map((song) => ({
        ...song,
        annotationCount: getStoredAnnotations(song.id).length,
      }))
      .filter((song) => {
        const query = searchQuery.toLowerCase();
        return (
          song.title?.toLowerCase().includes(query) ||
          song.genre_display?.toLowerCase().includes(query) ||
          song.original_language_display?.toLowerCase().includes(query)
        );
      });
  }, [searchQuery, songs]);

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 font-sans pb-24 relative flex flex-col">
      <Navbar />

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40" />
        <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-violet-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manage Open Annotation Songs</h1>
            <p className="text-slate-500 mt-1">Review all of your songs that are currently open for community contributions.</p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-5 mb-8 shadow-sm">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search your open songs..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            />
          </div>
        </div>

        {fetchError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {fetchError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-60 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm animate-pulse" />
            ))
          ) : filteredSongs.length ? (
            filteredSongs.map((song) => (
              <button
                key={song.id}
                type="button"
                onClick={() => navigate(`/annotations/${song.id}/manage`)}
                className="text-left bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 border border-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-700">
                    <LockOpen size={13} />
                    Open for Annotation
                  </span>
                  <ArrowRight size={18} className="text-slate-400" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mb-2">{song.title}</h2>
                <p className="text-sm text-slate-500 mb-5 line-clamp-3">{song.original_lyrics || 'No lyrics preview available yet.'}</p>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock3 size={15} className="text-slate-400" />
                    {song.genre_display || song.genre || 'Unknown genre'}
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={15} className="text-slate-400" />
                    {song.annotationCount} contribution{song.annotationCount === 1 ? '' : 's'} saved
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-white/50">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <MessageSquare size={32} className="text-slate-400" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">No songs open for annotations</h3>
              <p className="text-slate-500 max-w-md">
                Open one of your drafts for annotation from the contribute flow and it will appear here for review management.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}