import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Globe2,
    Heart,
    BookOpen,
    PlayCircle,
    TrendingUp,
    Sparkles,
    Music,
    ThumbsUp,
    ChevronRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast.jsx';
import { API_ENDPOINTS, BASE_URL } from '../utils/constants';

export default function Explore() {
    const navigate = useNavigate();
    const { addToast } = useToast();

    // State for search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [activeLanguage, setActiveLanguage] = useState('All');
    const [activeGenre, setActiveGenre] = useState('All');
    const [activeOwner, setActiveOwner] = useState('All');
    const [sortOrder, setSortOrder] = useState('newest');

    const [languages, setLanguages] = useState(['All']);
    const [genres, setGenres] = useState(['All']);
    const [owners] = useState(['All', 'Independent Songwriters', 'Label Verified']);
    const [allSongs, setAllSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [favoriteLoadingId, setFavoriteLoadingId] = useState(null);
    const [likeLoadingId, setLikeLoadingId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setFetchError('');
                const [profileResponse, communityResponse, labelResponse] = await Promise.all([
                    fetch(`${BASE_URL}${API_ENDPOINTS.PROFILE}`, {
                        credentials: 'include',
                    }),
                    fetch(`${BASE_URL}/song/`, {
                        credentials: 'include',
                    }),
                    fetch(`${BASE_URL}/label-songs/`, {
                        credentials: 'include',
                    }),
                ]);

                if (!communityResponse.ok) {
                    throw new Error('Failed to fetch independent songwriter songs.');
                }

                if (!labelResponse.ok) {
                    throw new Error('Failed to fetch label songs.');
                }

                const [communitySongs, labelSongs] = await Promise.all([
                    communityResponse.json(),
                    labelResponse.json(),
                ]);
                const currentUsername = profileResponse.ok ? (await profileResponse.json()).username : null;
                const visibleCommunitySongs = currentUsername
                    ? communitySongs.filter((song) => song.author_username !== currentUsername)
                    : communitySongs;
                const visibleLabelSongs = currentUsername
                    ? labelSongs.filter((song) => song.label_account_username !== currentUsername)
                    : labelSongs;

                const palette = [
                    'from-blue-500 to-indigo-500',
                    'from-amber-400 to-orange-500',
                    'from-pink-500 to-rose-500',
                    'from-emerald-400 to-teal-500',
                    'from-violet-500 to-fuchsia-500',
                    'from-cyan-400 to-blue-500',
                ];

                const normalizedSongs = [
                    ...visibleCommunitySongs.map((song, index) => ({
                        id: song.id,
                        title: song.title ?? 'Untitled',
                        artist: song.author_username ?? 'Independent songwriter',
                        genre: song.genre_display ?? song.genre ?? 'Unknown',
                        originalLang: song.original_language_display ?? song.original_language ?? 'Unknown',
                        translatedTo: [],
                        likes: Number(song.likes) || 0,
                        annotations: song.can_annotate ? 1 : 0,
                        owner: song.owner_type ?? 'Independent Songwriters',
                        sourceType: 'song',
                        sourceId: song.id,
                        isFavorite: Boolean(song.is_favorite),
                        createdAt: song.created_at,
                        color: palette[index % palette.length],
                        status: song.status,
                        statusLabel:
                            song.status === 'PENDING'
                                ? song.can_annotate
                                    ? 'Annotations Open'
                                    : 'Annotations Paused'
                                : song.status_display ?? song.status ?? 'Unknown',
                        route:
                            song.status === 'PENDING' && song.can_annotate
                                ? `/annotate/${song.id}`
                                : `/song/${song.id}`,
                    })),
                    ...visibleLabelSongs.map((song, index) => ({
                        id: `label-${song.id}`,
                        title: song.title ?? 'Untitled',
                        artist: song.artist ?? 'Unknown artist',
                        genre: song.genre_display ?? song.genre ?? 'Unknown',
                        originalLang: song.original_language_display ?? song.original_language ?? 'Unknown',
                        translatedTo: [],
                        likes: Number(song.likes) || 0,
                        annotations: 0,
                        owner: 'Label Verified',
                        sourceType: 'label-song',
                        sourceId: song.id,
                        isFavorite: Boolean(song.is_favorite),
                        createdAt: song.created_at,
                        color: palette[(index + visibleCommunitySongs.length) % palette.length],
                        status: 'PUBLISHED',
                        statusLabel: 'Published',
                        route: `/label-song/${song.id}`,
                    })),
                ];

                setLanguages([
                    'All',
                    ...new Set(normalizedSongs.map((song) => song.originalLang).filter(Boolean)),
                ]);
                setGenres([
                    'All',
                    ...new Set(normalizedSongs.map((song) => song.genre).filter(Boolean)),
                ]);
                setAllSongs(normalizedSongs);

            } catch (error) {
                console.error("Error fetching data:", error);
                setFetchError(error.message || 'Unable to load songs right now.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleFavoriteToggle = async (event, song) => {
        event.stopPropagation();

        try {
            setFavoriteLoadingId(song.id);
            const endpoint =
                song.sourceType === 'label-song'
                    ? API_ENDPOINTS.LABEL_SONG_FAVORITE(song.sourceId)
                    : API_ENDPOINTS.SONG_FAVORITE(song.sourceId);
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: song.isFavorite ? 'DELETE' : 'POST',
                credentials: 'include',
            });

            if (response.status === 401) {
                navigate('/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Unable to update favorites right now.');
            }

            setAllSongs((currentSongs) =>
                currentSongs.map((currentSong) =>
                    currentSong.id === song.id
                        ? { ...currentSong, isFavorite: !song.isFavorite }
                        : currentSong
                )
            );
            addToast({
                title: song.isFavorite ? 'Removed from favorites' : 'Added to favorites',
                description: song.isFavorite
                    ? `${song.title} was removed from your favorites.`
                    : `${song.title} was added to your favorites.`,
            });
        } catch (error) {
            console.error('Error updating favorite:', error);
            setFetchError(error.message || 'Unable to update favorites right now.');
        } finally {
            setFavoriteLoadingId(null);
        }
    };

    const handleLike = async (event, song) => {
        event.stopPropagation();

        try {
            setLikeLoadingId(song.id);
            const endpoint =
                song.sourceType === 'label-song'
                    ? API_ENDPOINTS.LABEL_SONG_LIKE(song.sourceId)
                    : API_ENDPOINTS.SONG_LIKE(song.sourceId);
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Unable to like this song right now.');
            }

            const data = await response.json();
            setAllSongs((currentSongs) =>
                currentSongs.map((currentSong) =>
                    currentSong.id === song.id
                        ? { ...currentSong, likes: Number(data.likes) || currentSong.likes + 1 }
                        : currentSong
                )
            );
        } catch (error) {
            console.error('Error liking song:', error);
            setFetchError(error.message || 'Unable to like this song right now.');
        } finally {
            setLikeLoadingId(null);
        }
    };

    const filteredSongs = useMemo(() => {
        const filtered = allSongs.filter((song) => {
            const matchesSearch =
                song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                song.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLang =
                activeLanguage === 'All' ||
                song.originalLang === activeLanguage ||
                song.translatedTo.includes(activeLanguage);
            const matchesGenre = activeGenre === 'All' || song.genre === activeGenre;
            const matchesOwner = activeOwner === 'All' || song.owner === activeOwner;
            return matchesSearch && matchesLang && matchesGenre && matchesOwner;
        });

        return filtered.sort((leftSong, rightSong) => {
            const leftTime = leftSong.createdAt ? new Date(leftSong.createdAt).getTime() : 0;
            const rightTime = rightSong.createdAt ? new Date(rightSong.createdAt).getTime() : 0;
            return sortOrder === 'oldest' ? leftTime - rightTime : rightTime - leftTime;
        });
    }, [activeGenre, activeLanguage, activeOwner, allSongs, searchQuery, sortOrder]);

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 font-sans pb-24 relative flex flex-col">
            <Navbar />
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[50%] h-[40%] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-[120px]"></div>
                <div className="absolute top-40 left-[-10%] w-[40%] h-[40%] bg-purple-200/40 rounded-full mix-blend-multiply filter blur-[120px]"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 w-full">

                {/* Page Header & Search */}
                <div className="flex flex-col items-center text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-6">
                        <Sparkles size={16} />
                        <span>Community Library</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
                        Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Lyricsverse</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mb-10">
                        Discover thousands of songs translated into regional languages, complete with cultural annotations and deep meanings.
                    </p>

                    {/* Large Search Bar */}


                    <div className="relative w-full max-w-md">
                        {/* The Icon Wrapper */}
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>

                        {/* The Input Field */}
                        <input
                            type="text"
                            placeholder="Search by author name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 sm:p-8 shadow-sm mb-12">

                    {/* Language Filter */}
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Globe2 size={14} /> Language
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {languages.map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => setActiveLanguage(lang)}
                                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${activeLanguage === lang
                                        ? 'bg-slate-900 text-white shadow-md transform scale-105'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50'
                                        }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Genre Filter */}
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Music size={14} /> Genre
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {genres.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => setActiveGenre(genre)}
                                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${activeGenre === genre
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 transform scale-105'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50'
                                        }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Owner Filter */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Music size={14} /> Owner
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {owners.map(owner => (
                                <button
                                    key={owner}
                                    onClick={() => setActiveOwner(owner)}
                                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${activeOwner === owner
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 transform scale-105'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50'
                                        }`}
                                >
                                    {owner}
                                </button>
                            ))}
                        </div>
                    </div>



                </div>

                {/* Results Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                            <TrendingUp className="text-indigo-600" size={24} />
                            {searchQuery ? 'Search Results' : 'Trending Now'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                            {loading ? 'Loading songs...' : `Showing ${filteredSongs.length} songs`}
                        </p>
                        {fetchError ? (
                            <p className="text-sm text-red-500 mt-2">{fetchError}</p>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                        <label htmlFor="explore-sort" className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Sort By
                        </label>
                        <select
                            id="explore-sort"
                            value={sortOrder}
                            onChange={(event) => setSortOrder(event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                        </select>
                    </div>
                </div>

                {/* Songs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {loading ? (
                        <div className="col-span-full py-20 flex items-center justify-center text-slate-500">
                            Loading songs...
                        </div>
                    ) : filteredSongs.length > 0 ? (
                        filteredSongs.map((song) => (
                            <div
                                key={song.id}
                                className={`group bg-white border border-slate-200/60 rounded-[2rem] p-4 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300 flex flex-col ${song.route ? 'cursor-pointer' : 'cursor-default'}`}
                                onClick={() => song.route && navigate(song.route)}
                            >

                                {/* Abstract Album Art */}
                                <div className={`w-full aspect-video rounded-2xl bg-gradient-to-br ${song.color} mb-5 relative overflow-hidden shadow-inner flex items-center justify-center`}>
                                    {/* Decorative glass overlay */}
                                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>

                                    {/* Hover Play Button */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-900/20 backdrop-blur-sm">
                                        <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                                            <PlayCircle size={28} className="text-indigo-600 ml-1" />
                                        </div>
                                    </div>

                                    {/* Genre Badge */}
                                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                        {song.genre}
                                    </div>
                                    <div className="absolute top-3 left-3 bg-slate-950/30 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
                                        {song.statusLabel}
                                    </div>
                                    <button
                                        type="button"
                                        aria-label={song.isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                                        onClick={(event) => handleFavoriteToggle(event, song)}
                                        disabled={favoriteLoadingId === song.id}
                                        className={`absolute bottom-3 right-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 backdrop-blur-md transition-colors ${
                                            song.isFavorite
                                                ? 'bg-white text-pink-600'
                                                : 'bg-slate-950/25 text-white hover:bg-white hover:text-pink-600'
                                        } ${favoriteLoadingId === song.id ? 'opacity-60 cursor-wait' : ''}`}
                                    >
                                        <Heart size={18} className={song.isFavorite ? 'fill-current' : ''} />
                                    </button>
                                </div>

                                {/* Song Info */}
                                <div className="px-2 flex-grow">
                                    <h3 className="text-xl font-extrabold text-slate-900 mb-1 line-clamp-1">{song.title}</h3>
                                    <p className="text-sm font-medium text-slate-500 mb-4">{song.artist}</p>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{song.owner}</p>

                                    {/* Translation Path */}
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                                        <span className="text-slate-600">{song.originalLang}</span>
                                        <ChevronRight size={14} className="text-indigo-400" />
                                        <span className="text-indigo-600">
                                            {song.translatedTo.length > 0 ? song.translatedTo.join(', ') : 'Original'}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Footer (Stats) */}
                                <div className="px-2 pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={(event) => handleLike(event, song)}
                                            disabled={likeLoadingId === song.id}
                                            className={`flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-pink-600 ${likeLoadingId === song.id ? 'opacity-60 cursor-wait' : ''}`}
                                        >
                                            <ThumbsUp size={16} className="transition-colors hover:fill-pink-600" />
                                            {song.likes}
                                        </button>
                                        {/* <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">
                                            <BookOpen size={16} />
                                            {song.annotations}
                                        </div> */}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors text-slate-400">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>

                            </div>
                        ))
                    ) : (
                        /* Empty State */
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-white/50 backdrop-blur-sm">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <Search size={32} className="text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">No songs found</h3>
                            <p className="text-slate-500 max-w-md">
                                We couldn't find any songs matching your exact search and filters. Try adjusting your categories or search terms.
                            </p>
                            <button
                                onClick={() => { setSearchQuery(''); setActiveGenre('All'); setActiveLanguage('All'); setActiveOwner('All'); }}
                                className="mt-6 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 rounded-xl font-bold transition-colors"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
