import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast.jsx';
import { API_ENDPOINTS, BASE_URL, LANGUAGES } from '../utils/constants';
import {
  Save,
  Send,
  Languages,
  Highlighter,
  BookOpen,
  Music,
  Info,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  LoaderCircle,
  History,
  Eye,
  Lock,
  LockOpen,
  UploadCloud,
} from 'lucide-react';

const DEFAULT_FORM = {
  title: '',
  genre: '',
  original_language: 'en',
  original_lyrics: '',
};

const DEFAULT_TRANSLATION_LANG = LANGUAGES.find((language) => language.code !== 'en')?.code || 'hi';

const STATUS_COPY = {
  DRAFT: {
    label: 'Draft',
    tone: 'bg-amber-50 text-amber-700 border border-amber-200/70',
  },
  PENDING: {
    label: 'Open for Annotation',
    tone: 'bg-sky-50 text-sky-700 border border-sky-200/70',
  },
  PUBLISHED: {
    label: 'Finally Published',
    tone: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
  },
};

const buildVersionEntry = (song, label) => ({
  id: `${label}-${song.id || 'draft'}-${song.created_at || Date.now()}`,
  label,
  title: song.title || 'Untitled Song',
  original_lyrics: song.original_lyrics || '',
  original_language: song.original_language || 'en',
  genre: song.genre || '',
  created_at: song.created_at || new Date().toISOString(),
  status: song.status || 'DRAFT',
});

const getVersionStorageKey = (songId) => `lyricsverse-song-versions-${songId}`;

export default function Contribute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const requestedSongId = searchParams.get('songId') || searchParams.get('id');

  const [activeTab, setActiveTab] = useState('translate');
  const [targetLang, setTargetLang] = useState(DEFAULT_TRANSLATION_LANG);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [songId, setSongId] = useState(requestedSongId);
  const [songStatus, setSongStatus] = useState('DRAFT');
  const [genres, setGenres] = useState([]);
  const [languageOptions, setLanguageOptions] = useState(LANGUAGES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [initialVersion, setInitialVersion] = useState(null);
  const [savedVersions, setSavedVersions] = useState([]);
  const [translatedText, setTranslatedText] = useState('');

  const statusMeta = STATUS_COPY[songStatus] || STATUS_COPY.DRAFT;
  const isPublished = songStatus === 'PUBLISHED';
  const annotationAccessOpen = songStatus === 'PENDING';
  const isEditable = !isPublished;

  useEffect(() => {
    const fetchBootstrapData = async () => {
      try {
        setLoading(true);
        setFetchError('');

        const requests = [
          axios.get(`${BASE_URL}${API_ENDPOINTS.PROFILE}`, { withCredentials: true }),
          axios.get(`${BASE_URL}${API_ENDPOINTS.GENRES}`, { withCredentials: true }),
          axios.get(`${BASE_URL}${API_ENDPOINTS.LANGUAGES}`, { withCredentials: true }),
        ];

        if (requestedSongId) {
          requests.push(
            axios.get(`${BASE_URL}${API_ENDPOINTS.SONGS}${requestedSongId}/`, {
              withCredentials: true,
            }),
          );
        }

        const [profileResponse, genreResponse, languageResponse, songResponse] = await Promise.all(requests);
        const role = profileResponse?.data?.role;

        if (role && role !== 'user') {
          setFetchError('This editor currently supports contributor song drafts for user accounts.');
        }

        const normalizedLanguages = Array.isArray(languageResponse?.data) && languageResponse.data.length
          ? languageResponse.data.map((language) => ({
              code: language.name,
              label: language.display_name,
            }))
          : LANGUAGES;

        setGenres(Array.isArray(genreResponse?.data) ? genreResponse.data : []);
        setLanguageOptions(normalizedLanguages);

        if (songResponse?.data) {
          const song = songResponse.data;
          const nextForm = {
            title: song.title || '',
            genre: song.genre || '',
            original_language: song.original_language || normalizedLanguages[0]?.code || 'en',
            original_lyrics: song.original_lyrics || '',
          };

          setSongId(String(song.id));
          setSongStatus(song.status || 'DRAFT');
          setFormData(nextForm);
          setLastSavedAt(song.created_at || '');

          const firstVersion = buildVersionEntry(song, 'Initial Version');
          setInitialVersion(firstVersion);

          try {
            const storedVersions = JSON.parse(localStorage.getItem(getVersionStorageKey(song.id)) || '[]');
            const mergedVersions = storedVersions.length ? storedVersions : [firstVersion];
            setSavedVersions(mergedVersions);
          } catch {
            setSavedVersions([firstVersion]);
          }
        }
      } catch (error) {
        console.error('Failed to load contribute workspace:', error);

        if (error.response?.status === 401) {
          navigate('/login');
          return;
        }

        if (error.response?.status === 403) {
          setFetchError('You can only edit your own song drafts here.');
        } else {
          setFetchError('Unable to load the contribution workspace right now.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBootstrapData();
  }, [navigate, requestedSongId]);

  useEffect(() => {
    if (targetLang !== formData.original_language) {
      return;
    }

    const nextTargetLanguage = languageOptions.find(
      (language) => language.code !== formData.original_language,
    )?.code;

    if (nextTargetLanguage) {
      setTargetLang(nextTargetLanguage);
    }
  }, [formData.original_language, languageOptions, targetLang]);

  const updateFormValue = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === 'original_lyrics') {
      setTranslatedText('');
    }
    if (field === 'original_language') {
      setTranslatedText('');
    }
  };

  const persistVersionSnapshot = (song, label) => {
    if (!song?.id) {
      return;
    }

    const nextEntry = buildVersionEntry(song, label);

    setSavedVersions((current) => {
      const alreadyExists = current.some((version) => version.id === nextEntry.id);
      const nextVersions = alreadyExists ? current : [nextEntry, ...current];

      try {
        localStorage.setItem(getVersionStorageKey(song.id), JSON.stringify(nextVersions));
      } catch {
        // Ignore storage failures and keep the save flow moving.
      }

      return nextVersions;
    });

    if (!initialVersion) {
      setInitialVersion(nextEntry);
    }
  };

  const saveDraft = async (showToast = true) => {
    if (!formData.title.trim()) {
      addToast({
        type: 'error',
        title: 'Title required',
        description: 'Add a song title before saving your draft.',
      });
      return null;
    }

    try {
      setSaving(true);

      const payload = {
        title: formData.title.trim(),
        genre: formData.genre || '',
        original_language: formData.original_language,
        original_lyrics: formData.original_lyrics,
      };

      const response = songId
        ? await axios.patch(`${BASE_URL}${API_ENDPOINTS.SONGS}${songId}/`, payload, {
            withCredentials: true,
          })
        : await axios.post(`${BASE_URL}${API_ENDPOINTS.SONGS}`, payload, {
            withCredentials: true,
          });

      const savedSong = response.data;
      setSongId(String(savedSong.id));
      setSongStatus(savedSong.status || 'DRAFT');
      setLastSavedAt(new Date().toISOString());
      persistVersionSnapshot(savedSong, savedVersions.length ? 'Updated Version' : 'Initial Version');

      if (!requestedSongId) {
        navigate(`/contribute?songId=${savedSong.id}`, { replace: true });
      }

      if (showToast) {
        addToast({
          type: 'success',
          title: 'Draft saved',
          description: 'Your latest lyrics are now stored in the backend draft.',
        });
      }

      return savedSong;
    } catch (error) {
      console.error('Failed to save draft:', error);
      addToast({
        type: 'error',
        title: 'Save failed',
        description: 'We could not save this draft to the backend right now.',
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const savedSong = await saveDraft(false);

    if (!savedSong?.id) {
      return;
    }

    try {
      setPublishing(true);
      const isFinalPublish = savedSong.status === 'PENDING' || songStatus === 'PENDING';
      const endpoint = isFinalPublish
        ? API_ENDPOINTS.SONG_FINAL_PUBLISH(savedSong.id)
        : API_ENDPOINTS.SONG_SUBMIT(savedSong.id);
      const response = await axios.post(`${BASE_URL}${endpoint}`, {}, { withCredentials: true });
      const nextSong = response.data?.song;

      setSongStatus(response.data?.status || nextSong?.status || 'PENDING');
      setLastSavedAt(new Date().toISOString());
      if (nextSong) {
        persistVersionSnapshot(nextSong, 'Updated Version');
      }

      addToast({
        type: 'success',
        title: isFinalPublish ? 'Song published' : 'Annotations opened',
        description: isFinalPublish
          ? 'This song is now finally published and locked for further editing.'
          : 'Your song is now visible in Explore for community annotations.',
      });
    } catch (error) {
      console.error('Failed to publish draft:', error);

      const description =
        error.response?.data?.error ||
        'This draft could not be submitted for publishing right now.';

      addToast({
        type: 'error',
        title: 'Publish failed',
        description,
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleTranslate = async (event) => {
    event.preventDefault();

    if (!formData.original_lyrics.trim()) {
      addToast({
        type: 'info',
        title: 'Lyrics needed',
        description: 'Add some lyrics first so the translation workspace has content to work with.',
      });
      return;
    }

    if (targetLang === formData.original_language) {
      addToast({
        type: 'info',
        title: 'Choose another language',
        description: 'The output language should be different from the original language.',
      });
      return;
    }

    try {
      setIsTranslating(true);
      const response = await axios.post(
        `${BASE_URL}${API_ENDPOINTS.SONG_TRANSLATE_PREVIEW}`,
        {
          lyrics: formData.original_lyrics,
          source_language: formData.original_language,
          target_language: targetLang,
        },
        {
          withCredentials: true,
        },
      );

      setTranslatedText(response.data?.translated_lyrics || '');
    } catch (error) {
      console.error('Failed to translate preview:', error);
      setTranslatedText('');
      addToast({
        type: 'error',
        title: 'Translation failed',
        description:
          error.response?.data?.error ||
          'We could not translate the current lyrics right now.',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const currentLanguageLabel = useMemo(() => {
    return languageOptions.find((language) => language.code === formData.original_language)?.label || formData.original_language;
  }, [formData.original_language, languageOptions]);

  const translatedPreview = useMemo(() => translatedText, [translatedText]);

  const currentVersionPreview = useMemo(() => {
    return {
      title: formData.title || 'Untitled Song',
      original_lyrics: formData.original_lyrics || 'No lyrics yet.',
      original_language: formData.original_language,
      genre: formData.genre || 'Not set',
      created_at: lastSavedAt || new Date().toISOString(),
      status: songStatus,
    };
  }, [formData, lastSavedAt, songStatus]);

  const versionTimeline = useMemo(() => {
    const versions = [...savedVersions];

    if (!versions.length && initialVersion) {
      versions.push(initialVersion);
    }

    return versions;
  }, [initialVersion, savedVersions]);

  const lastSavedLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Not saved yet';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 font-sans flex flex-col relative pb-20">
        <Navbar />
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-50" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-10">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-10 shadow-sm animate-pulse">
            <div className="h-7 w-52 rounded-xl bg-slate-200 mb-4" />
            <div className="h-4 w-64 rounded bg-slate-200 mb-10" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="h-40 rounded-3xl bg-slate-100" />
                <div className="h-[520px] rounded-3xl bg-slate-100" />
              </div>
              <div className="lg:col-span-4 h-[680px] rounded-3xl bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 font-sans flex flex-col relative pb-20">
      <Navbar />

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-35" />
      </div>

      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-slate-200/60 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {songId ? 'Update Song Draft' : 'Create New Song'}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 ${statusMeta.tone}`}>
                  {statusMeta.label}
                </span>
                <span>Last saved: {lastSavedLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => saveDraft(true)}
              disabled={saving || publishing || !isEditable}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-full transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
              Save Draft
            </button>
            <button
              onClick={handlePublish}
              disabled={saving || publishing || !isEditable}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {publishing ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
              {songStatus === 'PENDING' ? 'Final Publish' : songStatus === 'PUBLISHED' ? 'Published' : 'Open for Annotation'}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8 flex-grow">
        {fetchError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {fetchError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-6 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Song Title</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Music className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(event) => updateFormValue('title', event.target.value)}
                      disabled={!isEditable}
                      placeholder="e.g., Midnight Rain"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Genre</label>
                  <div className="relative">
                    <select
                      value={formData.genre}
                      onChange={(event) => updateFormValue('genre', event.target.value)}
                      disabled={!isEditable}
                      className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      <option value="">Select genre</option>
                      {genres.map((genre) => (
                        <option key={genre.name} value={genre.name}>
                          {genre.display_name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Original Language</label>
                  <div className="relative">
                    <select
                      value={formData.original_language}
                      onChange={(event) => updateFormValue('original_language', event.target.value)}
                      disabled={!isEditable}
                      className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      {languageOptions.map((language) => (
                        <option key={language.code} value={language.code}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>


            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-grow min-h-[500px]">
              <div className="border-b border-slate-200/60 bg-slate-50/50 p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab('wiki')}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
                    title="Review annotation settings"
                  >
                    <Highlighter size={16} />
                    <span className="hidden sm:inline">Annotation Settings</span>
                  </button>
                </div>

                <button
                  onClick={handleTranslate}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
                >
                  {isTranslating ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircle size={16} className="animate-spin" />
                      Refreshing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles size={16} />
                      Refresh Translation Preview
                    </span>
                  )}
                </button>
              </div>

              <textarea
                value={formData.original_lyrics}
                onChange={(event) => updateFormValue('original_lyrics', event.target.value)}
                disabled={!isEditable}
                className="w-full flex-grow p-6 bg-transparent resize-none focus:outline-none text-slate-800 text-lg leading-relaxed placeholder-slate-300 font-medium disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="Start writing your lyrics here...&#10;&#10;[Verse 1]&#10;Walking through the midnight rain...&#10;&#10;Open the song for annotation when you want it to appear in Explore for community contributions."
              />
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col h-full">
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col sticky top-28 min-h-[600px] h-full">
              <div className="flex border-b border-slate-200/60">
                <button
                  onClick={() => setActiveTab('translate')}
                  className={`flex-1 flex justify-center items-center gap-2 py-4 text-sm font-bold transition-colors ${activeTab === 'translate' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  <Languages size={18} />
                  Translation
                </button>
                <button
                  onClick={() => setActiveTab('wiki')}
                  className={`flex-1 flex justify-center items-center gap-2 py-4 text-sm font-bold transition-colors ${activeTab === 'wiki' ? 'text-cyan-700 border-b-2 border-cyan-600 bg-cyan-50/40' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  <BookOpen size={18} />
                  Collaboration
                </button>
                <button
                  onClick={() => setActiveTab('versions')}
                  className={`flex-1 flex justify-center items-center gap-2 py-4 text-sm font-bold transition-colors ${activeTab === 'versions' ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-100/80' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  <History size={18} />
                  Versions
                </button>
              </div>

              {activeTab === 'translate' && (
                <div className="flex flex-col flex-grow p-5 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center mb-4 gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Target Language</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Source language: {currentLanguageLabel}
                      </p>
                    </div>
                    <select
                      value={targetLang}
                      onChange={(event) => {
                        setTargetLang(event.target.value);
                        setTranslatedText('');
                      }}
                      className="text-sm bg-slate-100 border-none rounded-lg px-3 py-1.5 font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600/20 outline-none cursor-pointer"
                    >
                      {languageOptions
                        .filter((language) => language.code !== formData.original_language)
                        .map((language) => (
                          <option key={language.code} value={language.code}>
                            {language.label}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex-grow bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-slate-600 text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap">
                    {!formData.original_lyrics.trim() ? (
                      <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                        <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-4 border-2 border-white shadow-sm">
                          <Languages size={24} className="text-indigo-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 mb-1">No lyrics yet</p>
                        <p className="text-xs text-slate-400">Add lyrics in the editor on the left, then generate a translation preview here.</p>
                      </div>
                    ) : isTranslating ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                        <LoaderCircle size={28} className="animate-spin" />
                        <p className="text-sm font-medium">Translating your current lyrics...</p>
                      </div>
                    ) : !translatedPreview ? (
                      <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                        <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-4 border-2 border-white shadow-sm">
                          <Sparkles size={24} className="text-indigo-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 mb-1">No translation yet</p>
                        <p className="text-xs text-slate-400 mb-5">
                          Generate a preview of your lyrics in{' '}
                          {languageOptions.find((l) => l.code === targetLang)?.label || targetLang}.
                        </p>
                        <button
                          onClick={handleTranslate}
                          disabled={isTranslating}
                          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300/70 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                          <Sparkles size={15} className="relative z-10 transition-transform duration-300 group-hover:rotate-12" />
                          <span className="relative z-10">Translate Preview</span>
                        </button>
                      </div>
                    ) : (
                      translatedPreview
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'wiki' && (
                <div className="flex flex-col flex-grow p-5 animate-in fade-in duration-300 gap-4">
                  <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 flex gap-3 text-cyan-900">
                    <Info size={20} className="flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium leading-relaxed">
                      Drafts stay private, songs in the annotation stage are visible in Explore for community input, and final publishing closes collaboration and locks the song.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Annotation Access</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Status: {songStatus === 'DRAFT' ? 'Private draft' : annotationAccessOpen ? 'Open in Explore' : 'Closed and locked'}
                        </p>
                      </div>
                      <UploadCloud size={18} className="text-slate-400" />
                    </div>
                    <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                      While the song is in the annotation stage, other users can discover it under independent songwriters and contribute annotations. After final publish, the song remains public but the author editor becomes read-only.
                    </p>
                  </div>Each successful save adds an updated version entry so the author can compare the earliest and latest lyric states.

                  <div className="rounded-2xl border border-dashed border-slate-200 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">What authors can review</p>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div className="flex items-start gap-3">
                        <Eye size={16} className="mt-0.5 text-slate-400" />
                        <p>The initial version is captured once the backend returns the first saved record.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <History size={16} className="mt-0.5 text-slate-400" />
                        <p>Each successful save adds an updated version entry so the author can compare the earliest and latest lyric states.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'versions' && (
                <div className="flex flex-col flex-grow p-5 animate-in fade-in duration-300 gap-4 overflow-y-auto">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-900">Author Version Access</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Both the first saved version and later updates stay visible in this editor workspace.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">Initial Version</p>
                      <p className="text-sm font-bold text-slate-900">{initialVersion?.title || 'Not saved yet'}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {initialVersion?.created_at
                          ? new Date(initialVersion.created_at).toLocaleString('en-IN')
                          : 'Save this draft once to create the initial snapshot.'}
                      </p>
                      <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-700">
                        {initialVersion?.original_lyrics || 'No saved lyrics yet.'}
                      </pre>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Current Draft</p>
                      <p className="text-sm font-bold text-slate-900">{currentVersionPreview.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(currentVersionPreview.created_at).toLocaleString('en-IN')}
                      </p>
                      <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-700">
                        {currentVersionPreview.original_lyrics}
                      </pre>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Saved Timeline</p>
                    {versionTimeline.length ? (
                      <div className="space-y-3">
                        {versionTimeline.map((version) => (
                          <div key={version.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-bold text-slate-900">{version.label}</p>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${(STATUS_COPY[version.status] || STATUS_COPY.DRAFT).tone}`}>
                                {(STATUS_COPY[version.status] || STATUS_COPY.DRAFT).label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(version.created_at).toLocaleString('en-IN')}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No saved versions yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
