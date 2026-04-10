import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Music,
  MoreVertical,
  Trash2,
  Edit3,
  Share2,
  Globe2,
  BookOpen,
  TrendingUp,
  X,
  AlertCircle,
  User,
  Star,
  Clock3,
  CheckCircle2,
  Heart,
} from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast.jsx';
import { API_ENDPOINTS, BASE_URL, LANGUAGES } from '../utils/constants';

const STATUS_STYLES = {
  Published: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
  Draft: 'bg-amber-50 text-amber-700 border border-amber-200/50',
  'Open for Annotation': 'bg-sky-50 text-sky-700 border border-sky-200/50',
};

const STATUS_LABELS = {
  PUBLISHED: 'Published',
  DRAFT: 'Draft',
  PENDING: 'Open for Annotation',
};

const languageLabelMap = LANGUAGES.reduce((acc, language) => {
  acc[language.code] = language.label;
  return acc;
}, {});

export default function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState(null);
  const [user, setUser] = useState(null);
  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setFetchError('');

        const [profileResponse, songsResponse, favoritesResponse] = await Promise.all([
          axios.get(BASE_URL + API_ENDPOINTS.PROFILE, { withCredentials: true }),
          axios.get(BASE_URL + API_ENDPOINTS.MY_SONGS, { withCredentials: true }),
          axios.get(BASE_URL + API_ENDPOINTS.FAVORITES, { withCredentials: true }),
        ]);

        setUser(profileResponse.data);
        setSongs(songsResponse.data);
        setFavorites(Array.isArray(favoritesResponse.data) ? favoritesResponse.data : []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);

        if (error.response?.status === 401) {
          navigate('/login');
          return;
        }

        setFetchError('Unable to load your workspace right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const openDeleteDialog = (song) => {
    setSongToDelete(song);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleteLoading) {
      return;
    }
    setIsDeleteDialogOpen(false);
    setSongToDelete(null);
  };

  const confirmDelete = async () => {
    if (!songToDelete) {
      return;
    }

    try {
      setDeleteLoading(true);
      await axios.delete(`${BASE_URL}${API_ENDPOINTS.SONGS}${songToDelete.id}/`, {
        withCredentials: true,
      });
      setSongs((currentSongs) => currentSongs.filter((song) => song.id !== songToDelete.id));
      closeDeleteDialog();
    } catch (error) {
      console.error('Failed to delete song:', error);
      setFetchError('Could not delete that song right now.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const normalizedSongs = useMemo(() => {
    return songs.map((song) => {
      const createdAt = song.created_at ? new Date(song.created_at) : null;
      const ratingValue = Number(song.rating) || 0;
      const genre = song.genre_display || 'Unknown Genre';
      const status = STATUS_LABELS[song.status] || song.status || 'Draft';

      return {
        id: song.id,
        title: song.title || 'Untitled Song',
        originalLang: song.original_language_display || languageLabelMap[song.original_language] || song.original_language || 'Unknown',
        status,
        date:
          createdAt && !Number.isNaN(createdAt.getTime())
            ? createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Recently updated',
        views: Math.max(Math.round(ratingValue * 250), 0),
        rating: ratingValue,
        genre: genre,
        translatedTo: [],
        lyricsPreview: song.original_lyrics || '',
      };
    });
  }, [songs]);

  const normalizedFavorites = useMemo(() => {
    return favorites.map((favorite) => ({
      id: `favorite-${favorite.id}`,
      favoriteId: favorite.id,
      sourceId: favorite.source_id,
      title: favorite.song_title || 'Untitled Song',
      artist: favorite.artist_name || 'Unknown artist',
      originalLang: favorite.original_language_display || languageLabelMap[favorite.original_language] || favorite.original_language || 'Unknown',
      status: 'Favorite',
      genre: favorite.genre_display || favorite.genre || 'Unknown Genre',
      ownerType: favorite.owner_type || 'Lyricsverse',
      route: favorite.route || '/explore',
      isLabelSong: Boolean(favorite.is_label_song),
    }));
  }, [favorites]);

  const filteredItems = useMemo(() => {
    const sourceItems = activeTab === 'Favourites' ? normalizedFavorites : normalizedSongs;

    return sourceItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.originalLang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.artist || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab =
        activeTab === 'Favourites' || activeTab === 'All' || item.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [activeTab, normalizedFavorites, normalizedSongs, searchQuery]);

  const dashboardStats = useMemo(() => {
    const publishedCount = normalizedSongs.filter((song) => song.status === 'Published').length;
    const pendingCount = normalizedSongs.filter((song) => song.status === 'Open for Annotation').length;
    const averageRating = normalizedSongs.length
      ? (normalizedSongs.reduce((sum, song) => sum + song.rating, 0) / normalizedSongs.length).toFixed(1)
      : '0.0';

    return [
      { label: 'Total Songs', value: normalizedSongs.length, icon: Music, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: 'Favorites', value: normalizedFavorites.length, icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
      { label: 'Open for Annotation', value: pendingCount, icon: Clock3, color: 'text-sky-600', bg: 'bg-sky-50' },
      { label: 'Published', value: publishedCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Rating', value: averageRating, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];
  }, [normalizedFavorites.length, normalizedSongs]);

  const preferredLanguageLabel = languageLabelMap[user?.preferred_language] || user?.preferred_language || 'Not set';
  const publishedSongsCount = normalizedSongs.filter((song) => song.status === 'Published').length;
  const userRating = Number(user?.rating) || 0;

  const handleRemoveFavorite = async (favorite) => {
    try {
      const endpoint = favorite.isLabelSong
        ? API_ENDPOINTS.LABEL_SONG_FAVORITE(favorite.sourceId)
        : API_ENDPOINTS.SONG_FAVORITE(favorite.sourceId);
      await axios.delete(`${BASE_URL}${endpoint}`, { withCredentials: true });
      setFavorites((currentFavorites) => currentFavorites.filter((item) => item.id !== favorite.favoriteId));
      addToast({
        title: 'Removed from favorites',
        description: `${favorite.title} has been removed from your favorites.`,
      });
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      setFetchError('Could not update favorites right now.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 font-sans pb-20 relative">
      <Navbar />
      <style>{`
        @keyframes modalScale {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal {
          animation: modalScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[50%] h-[30%] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Workspace</h1>
            <p className="text-slate-500 mt-1">Track your songs, drafts, review status, and profile details in one place.</p>
          </div>
          <button
            onClick={() => navigate('/contribute')}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <Plus size={18} />
            Create New Song
          </button>
        </div>

        {fetchError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {fetchError}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-12">
          <div className="xl:col-span-4 bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-sm">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-14 w-14 rounded-full bg-slate-200" />
                <div className="h-7 w-40 rounded-xl bg-slate-200" />
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-20 w-full rounded-2xl bg-slate-100" />
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-200 border border-white shadow-sm flex items-center justify-center">
                    <User size={28} className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">{user?.first_name?.trim() || user?.username || 'Your Profile'}</h2>
                    <p className="text-sm text-slate-500">{user?.email || 'No email added'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Preferred Language</p>
                    <p className="text-sm font-bold text-slate-900">{preferredLanguageLabel}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">User Rating</p>
                    {userRating ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={star <= Math.round(userRating) ? 'fill-amber-500 text-amber-500' : 'text-amber-200'}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-slate-900">No rating yet</p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Published Songs</p>
                    <p className="text-sm font-bold text-slate-900">{publishedSongsCount}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {(loading ? Array.from({ length: 5 }) : dashboardStats).slice(0, 5).map((stat, index) =>
              loading ? (
                <div key={index} className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-slate-200 mb-4" />
                  <div className="h-4 w-24 rounded bg-slate-200 mb-2" />
                  <div className="h-8 w-16 rounded bg-slate-200" />
                </div>
              ) : (
                <div key={stat.label} className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                  <div className={`w-14 h-14 rounded-full ${stat.bg} flex items-center justify-center`}>
                    <stat.icon size={24} className={stat.color} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-extrabold text-slate-900">{stat.value}</h3>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-2 sm:p-4 shadow-sm mb-8 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center sticky top-24 z-30 backdrop-blur-xl bg-white/80">
          <div className="flex flex-col md:flex-row gap-3 md:items-center w-full lg:w-auto">
            <div className="flex bg-slate-100/80 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
              {['All', 'Published', 'Open for Annotation', 'Draft'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('Favourites')}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                activeTab === 'Favourites'
                  ? 'border-pink-200 bg-pink-50 text-pink-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-pink-200 hover:bg-pink-50/70 hover:text-pink-700'
              }`}
            >
              <Heart size={16} className={activeTab === 'Favourites' ? 'fill-current' : ''} />
              Favourites
            </button>
          </div>

          <div className="relative w-full sm:w-72 lg:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={activeTab === 'Favourites' ? 'Search favorite songs...' : 'Search your songs...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="flex justify-between items-start mb-6">
                  <div className="h-6 w-20 rounded-full bg-slate-200" />
                  <div className="h-8 w-8 rounded-lg bg-slate-200" />
                </div>
                <div className="h-7 w-2/3 rounded-xl bg-slate-200 mb-3" />
                <div className="h-4 w-1/2 rounded bg-slate-200 mb-6" />
                <div className="h-24 rounded-2xl bg-slate-100" />
              </div>
            ))
          ) : filteredItems.length > 0 ? (
            filteredItems.map((song) => (
              <div key={song.id} className="group bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${song.status === 'Favorite' ? 'bg-pink-50 text-pink-700 border border-pink-200/70' : STATUS_STYLES[song.status] || STATUS_STYLES.Draft}`}>
                    {song.status}
                  </span>

                  {activeTab === 'Favourites' ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(song)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-pink-50 px-3 py-1.5 text-sm font-bold text-pink-600 transition-colors hover:bg-pink-100"
                    >
                      <Trash2 size={15} />
              
                    </button>
                  ) : (
                    <div className="relative">
                      <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical size={18} />
                      </button>
                      <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 overflow-hidden origin-top-right transform scale-95 group-hover:scale-100">
                        <button
                          onClick={() => navigate(`/contribute?songId=${song.id}`)}
                          disabled={song.status === 'Published'}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-medium transition-colors disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent disabled:hover:text-slate-300"
                        >
                          <Edit3 size={14} /> {song.status === 'Published' ? 'Locked' : 'Edit'}
                        </button>
                        {song.status === 'Published' && (
                          <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-medium transition-colors">
                            <Share2 size={14} /> Share
                          </button>
                        )}
                        <div className="border-t border-slate-100" />
                        <button
                          onClick={() => openDeleteDialog(song)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-grow cursor-pointer" onClick={() => navigate(activeTab === 'Favourites' ? song.route : `/song/${song.id}`)}>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{song.title}</h3>
                  <p className="text-sm text-slate-500 mb-5 line-clamp-3">
                    {activeTab === 'Favourites'
                      ? `${song.artist} • ${song.ownerType}`
                      : song.lyricsPreview || 'No lyrics added yet. Open this song to continue writing.'}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <div className="flex items-center gap-1.5 bg-sky-50/70 border border-sky-100 px-2.5 py-1 rounded-md text-xs font-semibold text-sky-700">
                      <Globe2 size={12} className="text-sky-500" />
                      {song.genre}
                    </div>
                    <div className="flex items-center gap-1.5 bg-sky-50/70 border border-sky-100 px-2.5 py-1 rounded-md text-xs font-semibold text-sky-700">
                      <BookOpen size={12} className="text-sky-500" />
                      {song.originalLang}
                    </div>
                    {activeTab === 'Favourites' && (
                      <div className="flex items-center gap-1.5 bg-pink-50 border border-pink-100 px-2.5 py-1 rounded-md text-xs font-semibold text-pink-700">
                        <Heart size={12} className="text-pink-500 fill-current" />
                        {song.ownerType}
                      </div>
                    )}
                  </div>
                </div>

                {/* <div className="border-t border-slate-100 pt-4 flex justify-between items-center mt-auto">
                  <span className="text-xs font-medium text-slate-400">Created {song.date}</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <TrendingUp size={14} className="text-slate-400" />
                    {song.rating} rating
                  </span>
                </div> */}
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Music size={28} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No songs found</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                {searchQuery
                  ? `We couldn't find any ${activeTab === 'Favourites' ? 'favorite songs' : 'songs'} matching your search.`
                  : activeTab === 'All'
                    ? "You haven't created any songs yet. Start writing your first masterpiece."
                    : activeTab === 'Favourites'
                      ? "You haven't saved any favorite songs yet. Add them from Explore."
                    : `You don't have any ${activeTab.toLowerCase()} songs right now.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={closeDeleteDialog}
          />

          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-6 sm:p-8 animate-modal border border-slate-100">
            <button
              onClick={closeDeleteDialog}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
                <AlertCircle size={32} className="text-red-500" />
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
                Delete Song?
              </h3>

              <p className="text-slate-500 mb-8 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{songToDelete?.title}"</span>? This action cannot be undone.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={closeDeleteDialog}
                  className="flex-1 py-3.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 py-3.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
