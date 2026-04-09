import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Search,
  BookOpen,
  ThumbsUp,
  MessageSquare,
  Globe2,
  Music,
  Quote,
  Sparkles,
  LoaderCircle,
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

function buildLyricContext(term, languageLabel, meaning) {
  return `"${term}" carries a ${languageLabel.toLowerCase()} lyric texture that points toward ${meaning.toLowerCase()}.`;
}

export default function LyricWiki() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLang, setActiveLang] = useState(LANGUAGE_FILTERS[0]?.code || 'en');
  const [wikiTerms, setWikiTerms] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchWikiData = async () => {
      try {
        setLoading(true);
        setFetchError('');

        const [dictionaryResponse, genreResponse] = await Promise.all([
          axios.get(`${BASE_URL}${API_ENDPOINTS.DICTIONARY}`, { withCredentials: true }),
          axios.get(`${BASE_URL}${API_ENDPOINTS.GENRES}`, { withCredentials: true }),
        ]);

        setWikiTerms(Array.isArray(dictionaryResponse.data) ? dictionaryResponse.data : []);
        setGenres(Array.isArray(genreResponse.data) ? genreResponse.data : []);
      } catch (error) {
        console.error('Failed to load lyric wiki:', error);
        setFetchError('Unable to load the lyric wiki right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchWikiData();
  }, []);

  const termsWithUiData = useMemo(() => {
    return wikiTerms.map((term, index) => {
      const languageMeta = LANGUAGE_FILTERS.find((language) => language.code === term.language);
      const genre = genres[index % Math.max(genres.length, 1)] || null;
      const upvotes = 180 + ((index * 37) % 920);

      return {
        ...term,
        displayLanguage: term.language_display || languageMeta?.label || term.language,
        languageCode: term.language,
        upvotes,
        genreLabel: genre?.display_name || null,
        lyricContext: buildLyricContext(term.word, term.language_display || languageMeta?.label || term.language, term.meaning),
      };
    });
  }, [genres, wikiTerms]);

  const filteredTerms = useMemo(() => {
    return termsWithUiData.filter((term) => {
      const matchesSearch =
        term.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.meaning.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLang = term.languageCode === activeLang;
      return matchesSearch && matchesLang;
    });
  }, [activeLang, searchQuery, termsWithUiData]);

  const activeLanguageLabel =
    LANGUAGE_FILTERS.find((language) => language.code === activeLang)?.label || activeLang;

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-pink-100 selection:text-pink-900 font-sans pb-24 relative flex flex-col">
      <Navbar />
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[40%] h-[40%] bg-pink-200/40 rounded-full mix-blend-multiply filter blur-[120px]" />
        <div className="absolute bottom-1/4 left-0 w-[50%] h-[30%] bg-violet-200/40 rounded-full mix-blend-multiply filter blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 w-full">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 border border-pink-100 text-pink-700 text-sm font-semibold mb-6 shadow-sm">
            <BookOpen size={16} />
            <span>Community Dictionary</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">LyricWiki</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mb-10">
            Discover the cultural meanings, slang behind the lyrics. Created by songwriters, for the world.
          </p>

          <div className="w-full max-w-3xl">
            <div className="relative flex-grow group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search for a word, phrase, or meaning..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl text-base text-slate-900 placeholder-slate-400 shadow-md shadow-pink-100/20 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        <div className="mb-8 overflow-x-auto pb-2">
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

    

        {fetchError && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {fetchError}
          </div>
        )}

        {loading ? (
          <div className="py-24 flex items-center justify-center text-slate-500">
            <LoaderCircle size={24} className="animate-spin" />
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredTerms.length > 0 ? (
                filteredTerms.map((item) => (
                  <div key={item.id} className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-pink-100/40 hover:border-pink-200/60 transition-all duration-300 flex flex-col group">
                    <div className="flex justify-between items-start mb-4 gap-3">
                      <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-3">
                          {item.word}
                          <span className="text-sm font-medium text-slate-400 font-serif tracking-normal">
                           
                          </span>
                        </h2>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${LANGUAGE_TINT[item.languageCode] || 'bg-pink-50 text-pink-700 border border-pink-100'}`}>
                        {item.displayLanguage}
                      </span>
                    </div>
                   
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-1 mb-6 relative overflow-hidden">
                      <Quote size={80} className="absolute -top-4 -left-4 text-slate-100 rotate-180" />
                      <div className="relative z-10">
                        <p className="text-slate-700 font-medium italic mb-3">
                          {item.meaning}
                        </p>
                       
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-200 to-violet-200 rounded-full flex items-center justify-center text-pink-700 font-bold text-xs">
                          L
                        </div>
                        <span className="text-sm font-medium text-slate-500">LyricsVerse</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="flex items-center gap-1.5 bg-slate-50 hover:bg-pink-50 border border-slate-200 hover:border-pink-200 text-slate-600 hover:text-pink-600 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                        >
                          <ThumbsUp size={16} />
                          {item.upvotes}
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                        >
                          <MessageSquare size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-pink-200 rounded-[2rem] bg-pink-50/30 backdrop-blur-sm">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-pink-100">
                    <Search size={32} className="text-pink-400" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-2">No terms found</h3>
                  <p className="text-slate-500 max-w-md mb-6">
                    We couldn&apos;t find any imported dictionary terms for this language and search combination yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="flex items-center gap-2 bg-pink-600 text-white hover:bg-pink-700 px-6 py-3 rounded-xl font-bold transition-colors shadow-md shadow-pink-200"
                  >
                    <Sparkles size={18} /> Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
