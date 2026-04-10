import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  PlayCircle,
  Volume2,
  Square,
  Globe2,
  MessageSquare,
  Edit3,
  Music,
  CheckCircle2,
  ThumbsUp,
  User,
  Info,
  Sparkles,
  CalendarDays,
  Languages,
} from 'lucide-react';
import { useToast } from '../components/Toast.jsx';
import { API_ENDPOINTS, BASE_URL, LANGUAGES } from '../utils/constants';

function AnimatedTranslateButton({ label, fullWidth = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300/70 ${fullWidth ? 'w-full' : ''}`}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <Sparkles size={15} className="relative z-10 transition-transform duration-300 group-hover:rotate-12" />
      <span className="relative z-10">{label}</span>
    </button>
  );
}

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLabelSong = window.location.pathname.startsWith('/label-song/');
  const { addToast } = useToast();

  const [activeLang, setActiveLang] = useState('original');
  const [isFavorite, setIsFavorite] = useState(false);
  const [songData, setSongData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [translationsByLanguage, setTranslationsByLanguage] = useState({});
  const [translationLoadingLang, setTranslationLoadingLang] = useState('');

  useEffect(() => {
    const fetchSong = async () => {
      try {
        setLoading(true);
        setFetchError('');

        const response = await fetch(`${BASE_URL}${isLabelSong ? `/label-songs/${id}/` : `/song/${id}/`}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Song not found.' : 'Unable to load this song right now.');
        }

        const data = await response.json();
        setSongData(data);
        setIsFavorite(Boolean(data.is_favorite));
      } catch (error) {
        console.error('Error fetching song detail:', error);
        setFetchError(error.message || 'Unable to load this song right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [id, isLabelSong]);

  const normalizedSong = useMemo(() => {
    if (!songData) {
      return null;
    }

    const createdAt = songData.created_at ? new Date(songData.created_at) : null;

    return {
      ...songData,
      title: songData.title || 'Untitled Song',
      genreLabel: songData.genre_display || songData.genre || 'Unknown Genre',
      languageLabel: songData.original_language_display || songData.original_language || 'Unknown Language',
      authorLabel: songData.author_username || songData.label_account_username || 'Unknown Author',
      ratingValue: Number(songData.rating) || 0,
      likes: Number(songData.likes) || 0,
      coverColor: ['from-indigo-500 to-violet-600', 'from-sky-500 to-indigo-600', 'from-amber-500 to-orange-600'][Number(songData.id) % 3],
      createdLabel:
        createdAt && !Number.isNaN(createdAt.getTime())
          ? createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Recently added',
      aboutText: songData.original_lyrics
        ? `Written by ${songData.author_username || songData.label_account_username || 'the community'} in ${songData.original_language_display || songData.original_language || 'its original language'}, this song is available on Lyricsverse with its  original lyrics and verification status.`
        : `Written by ${songData.author_username || songData.label_account_username || 'the community'}, this song is available in Lyricsverse and ready for contributors to expand with richer translations and annotations.`,
    };
  }, [songData]);

  const lyricsData = useMemo(() => {
    const rawLyrics = normalizedSong?.original_lyrics || normalizedSong?.official_lyrics || '';
    const activeTranslationLines =
      activeLang !== 'original' && translationsByLanguage[activeLang]
        ? translationsByLanguage[activeLang].split('\n').map((line) => line.trim())
        : [];

    return rawLyrics
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => ({
        id: index + 1,
        original: line,
        translations: {},
        activeTranslation: activeTranslationLines[index] || '',
      }));
  }, [activeLang, normalizedSong, translationsByLanguage]);

  const languages = useMemo(() => {
    const originalLanguageCode = normalizedSong?.original_language;
    const originalLanguageLabel = normalizedSong?.languageLabel || 'Original';

    return [
      { code: 'original', label: `${originalLanguageLabel} (Original)` },
      ...LANGUAGES.filter((language) => language.code !== originalLanguageCode).map((language) => ({
        code: language.code,
        label: language.label,
      })),
    ];
  }, [normalizedSong]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = normalizedSong?.title || 'Lyricsverse Song';

    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleReadAloud = async () => {
    const textToRead =
      activeLang === 'original'
        ? lyricsData.map((line) => line.original).join('. ')
        : lyricsData
            .map((line) => line.activeTranslation || line.original)
            .join('. ');

    if (!textToRead.trim()) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }

    // Placeholder for future backend TTS integration.
    // Example:
    // const response = await fetch(`${BASE_URL}/song/${id}/speech/`, {
    //   method: 'POST',
    //   credentials: 'include',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     language: activeLang,
    //     text: textToRead,
    //   }),
    // });
    // const data = await response.json();
    // Then play the returned audio URL/blob here.

    if (!window.speechSynthesis) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = activeLang === 'original' ? normalizedSong.original_language || 'en' : activeLang;
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleFavoriteToggle = async () => {
    try {
      setFavoriteLoading(true);
      const endpoint = isLabelSong
        ? API_ENDPOINTS.LABEL_SONG_FAVORITE(id)
        : API_ENDPOINTS.SONG_FAVORITE(id);
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: isFavorite ? 'DELETE' : 'POST',
        credentials: 'include',
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Unable to update favorite status right now.');
      }

      const nextValue = !isFavorite;
      setIsFavorite(nextValue);
      setSongData((currentSong) =>
        currentSong ? { ...currentSong, is_favorite: nextValue } : currentSong
      );
      addToast({
        title: nextValue ? 'Added to favorites' : 'Removed from favorites',
        description: `${normalizedSong?.title || 'This song'} ${nextValue ? 'was added to' : 'was removed from'} your favorites.`,
      });
    } catch (error) {
      console.error('Favorite update failed:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      setLikeLoading(true);
      const endpoint = isLabelSong
        ? API_ENDPOINTS.LABEL_SONG_LIKE(id)
        : API_ENDPOINTS.SONG_LIKE(id);
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Unable to update likes right now.');
      }

      const data = await response.json();
      setSongData((currentSong) =>
        currentSong ? { ...currentSong, likes: Number(data.likes) || currentSong.likes } : currentSong
      );
    } catch (error) {
      console.error('Like update failed:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleTranslate = async (languageCode = activeLang) => {
    if (languageCode === 'original') {
      return;
    }

    if (translationsByLanguage[languageCode]?.trim()) {
      setActiveLang(languageCode);
      return;
    }

    const translateEndpoint = isLabelSong
      ? API_ENDPOINTS.LABEL_SONG_TRANSLATE(id)
      : API_ENDPOINTS.SONG_TRANSLATE(id);

    try {
      setTranslationLoadingLang(languageCode);
      const response = await fetch(`${BASE_URL}${translateEndpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_language: languageCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to translate this song right now.');
      }

      setTranslationsByLanguage((current) => ({
        ...current,
        [languageCode]: data.translated_lyrics || '',
      }));
      setActiveLang(languageCode);
    } catch (error) {
      console.error('Translation request failed:', error);
      addToast({
        type: 'error',
        title: 'Translation failed',
        description: error.message || 'We could not translate this song right now.',
      });
    } finally {
      setTranslationLoadingLang('');
    }
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 font-sans pb-24 relative flex flex-col">
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40" />
          <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-violet-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-30" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full mt-20">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-10 shadow-sm animate-pulse">
            <div className="h-6 w-32 bg-slate-200 rounded-full mb-6" />
            <div className="h-12 w-2/3 bg-slate-200 rounded-2xl mb-4" />
            <div className="h-6 w-1/2 bg-slate-200 rounded-xl mb-10" />
            <div className="h-48 bg-slate-100 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || !normalizedSong) {
    return (
      <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 font-sans pb-24 relative flex flex-col">
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40" />
          <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-violet-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-30" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 w-full mt-20">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-10 shadow-sm text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Unable to open this song</h1>
            <p className="text-slate-500 mb-6">{fetchError || 'Song data is unavailable right now.'}</p>
            <Link to="/explore" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
              <ArrowLeft size={16} /> Back to Explore
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 font-sans pb-24 relative flex flex-col">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40" />
        <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-violet-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-30" />
      </div>

      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-slate-200/60 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <Link to="/explore" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-semibold text-sm">
            <ArrowLeft size={18} /> Back to Explore
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
              className={`p-2 rounded-full transition-all ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400 hover:text-red-500'} ${favoriteLoading ? 'cursor-wait opacity-60' : ''}`}
            >
              <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
            </button>
            <button onClick={handleShare} className="p-2 bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-full transition-all">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full mt-8">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 sm:p-10 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start mb-8 animate-fade-up">
          <div className={`w-48 h-48 sm:w-56 sm:h-56 shrink-0 rounded-3xl bg-gradient-to-br ${normalizedSong.coverColor} shadow-lg shadow-indigo-200 flex items-center justify-center relative overflow-hidden group`}>
            <Music size={64} className="text-white/50" />
            <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <PlayCircle size={48} className="text-white" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left w-full">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100 uppercase tracking-wider">
                {normalizedSong.genreLabel}
              </span>
              <span className="bg-slate-50 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 tracking-wide">
                {normalizedSong.languageLabel}
              </span>
              <span className="bg-white text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 tracking-wide flex items-center gap-1.5">
                <User size={12} /> {normalizedSong.authorLabel}
              </span>
              {normalizedSong.status === 'PENDING' && (
                <span className="flex items-center gap-1 text-sky-600 text-xs font-bold">
                  <Languages size={14} /> Open for Annotation
                </span>
              )}
              {normalizedSong.status === 'PUBLISHED' && (
                <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                  <CheckCircle2 size={14} /> Verified
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight leading-tight">
              {normalizedSong.title}
            </h1>
            <p className="text-xl text-slate-600 font-medium mb-6">
              By {normalizedSong.authorLabel} • <span className="text-slate-400">{normalizedSong.languageLabel}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 border-t border-slate-100 pt-6 mt-auto">
              <button
                onClick={handleLike}
                disabled={likeLoading}
                className={`flex items-center gap-2 font-bold transition-colors text-slate-500 hover:text-slate-900 ${likeLoading ? 'cursor-wait opacity-60' : ''}`}
              >
                <ThumbsUp size={20} />
                {normalizedSong.likes}
              </button>

              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      className={star <= Math.round(normalizedSong.ratingValue) ? 'text-yellow-400 fill-current' : 'text-slate-300'}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-slate-600">{normalizedSong.ratingValue || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="lg:col-span-8">
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-4 shadow-sm mb-6 sticky top-20 z-30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                  <Globe2 className="text-slate-400 shrink-0 mr-2" size={20} />
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        if (lang.code === 'original') {
                          setActiveLang(lang.code);
                          return;
                        }

                        if (translationsByLanguage[lang.code]?.trim()) {
                          setActiveLang(lang.code);
                          return;
                        }

                        handleTranslate(lang.code);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                        activeLang === lang.code
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleReadAloud}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all ${
                    isSpeaking
                      ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
                  }`}
                >
                  {isSpeaking ? <Square size={16} /> : <Volume2 size={16} />}
                  {isSpeaking ? 'Stop Reading' : 'Read Aloud'}
                </button>
              </div>
            </div>

            <div className="bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-[2rem] p-6 sm:p-10 shadow-sm min-h-[400px]">
              {activeLang !== 'original' && !translationsByLanguage[activeLang] ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm">
                    <Globe2 size={32} className="text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                    {translationLoadingLang === activeLang ? 'Translating...' : 'No Translation Yet'}
                  </h3>
                  <p className="text-slate-500 max-w-md mb-6 leading-relaxed">
                    {translationLoadingLang === activeLang
                      ? 'Generating a translation from the backend. This may take a moment.'
                      : lyricsData.length === 0
                      ? 'No lyrics available yet, but you can still try generating a translation for this language.'
                      : 'Click translate to generate a translation for this song in the selected language.'}
                  </p>
                  <AnimatedTranslateButton
                    label={
                      translationLoadingLang === activeLang
                        ? 'Translating...'
                        : `Translate to ${languages.find((lang) => lang.code === activeLang)?.label || 'this language'}`
                    }
                    onClick={() => handleTranslate(activeLang)}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {lyricsData.length === 0 && (
                    <div className="py-16 text-center">
                      <p className="text-lg font-bold text-slate-800 mb-2">No lyrics added yet</p>
                      <p className="text-slate-500">This song exists in the catalog, but its lyrics have not been added yet.</p>
                    </div>
                  )}

                  {lyricsData.map((line) => {
                    const hasTranslation = activeLang !== 'original' && line.activeTranslation;

                    return (
                      <div key={line.id} className="group relative flex items-start gap-3 px-2 py-3 sm:px-3 sm:py-3 rounded-xl hover:bg-white/90 transition-colors cursor-text">
                        <div className="text-[11px] font-bold text-slate-300 mt-1.5 select-none w-5">
                          {line.id}
                        </div>

                        <div className="flex-1">
                          {activeLang === 'original' ? (
                            <p className="text-lg sm:text-xl font-semibold text-slate-800 leading-relaxed tracking-normal">
                              {line.original}
                            </p>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-slate-400 mb-1 leading-relaxed">
                                {line.original}
                              </p>
                              {hasTranslation ? (
                                <p className="text-lg sm:text-xl font-semibold text-indigo-950 leading-relaxed">
                                  {line.activeTranslation}
                                </p>
                              ) : (
                                translationLoadingLang !== activeLang && (
                                  <div className="mt-2">
                                    <AnimatedTranslateButton
                                      label="Create translation"
                                      onClick={() => handleTranslate(activeLang)}
                                    />
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-slate-900 p-1.5 rounded-xl shadow-xl transition-all translate-x-2 group-hover:translate-x-0">
                          <button className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Add Annotation">
                            <MessageSquare size={16} />
                          </button>
                          <button className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Suggest Edit">
                            <Edit3 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Info size={16} className="text-slate-400" /> About Song
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {normalizedSong.aboutText}
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Languages size={16} className="text-slate-400" /> Song Details
              </h3>

              <div className="space-y-4">
                {[
                  { label: 'Author', value: normalizedSong.authorLabel, icon: User },
                  { label: 'Original language', value: normalizedSong.languageLabel, icon: Globe2 },
                  { label: 'Status', value: normalizedSong.status, icon: CheckCircle2 },
                  { label: 'Added on', value: normalizedSong.createdLabel, icon: CalendarDays },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        <item.icon size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.label}</p>
                        <p className="text-xs font-medium text-slate-500">{item.value}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                      Live
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
              <h3 className="text-lg font-extrabold mb-2 relative z-10">Loved the Song Lyrics ?</h3>
              <p className="text-indigo-100 text-sm mb-4 relative z-10 leading-relaxed">
                Lyricsverse is built by songwriters like you. Help us improve these lyrics by suggesting an edit.
              </p>
              <div className="relative z-10">
                <AnimatedTranslateButton
                  label="Explore more with Lyricsverse"
                  fullWidth
                  onClick={() => navigate('/explore')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
