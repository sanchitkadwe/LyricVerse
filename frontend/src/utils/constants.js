// src/utils/constants.js

export const BASE_URL = 'http://localhost:8000/api'

export const API_ENDPOINTS = {
    LOGIN: '/user/login/',
    SIGNUP: '/user/signup/',
    LOGOUT: '/user/logout/',
    PROFILE: '/user/profile/',
    FAVORITES: '/user/favorites/',
    USER: '/user/',
    SONGS: '/song/',
    MY_SONGS: '/song/mine/',
    SONG_SUBMIT: (songId) => `/song/${songId}/submit/`,
    SONG_FINAL_PUBLISH: (songId) => `/song/${songId}/final_publish/`,
    SONG_FAVORITE: (songId) => `/song/${songId}/favorite/`,
    SONG_LIKE: (songId) => `/song/${songId}/like/`,
    SONG_TRANSLATE: (songId) => `/song/${songId}/translate/`,
    SONG_TRANSLATE_PREVIEW: '/song/translate-preview/',
    LABEL_SONG_FAVORITE: (songId) => `/label-songs/${songId}/favorite/`,
    LABEL_SONG_LIKE: (songId) => `/label-songs/${songId}/like/`,
    LABEL_SONG_TRANSLATE: (songId) => `/label-songs/${songId}/translate/`,
    LANGUAGES: '/languages/',
    GENRES: '/genre/',
    DICTIONARY: '/dictionary/',
    DICTIONARY_SAVE: (id) => `/dictionary/${id}/save_word/`,
    DICTIONARY_UNSAVE: (id) => `/dictionary/${id}/unsave_word/`,
    DICTIONARY_SAVED: '/dictionary/saved/',
    WORD_CONTRIBUTIONS: '/word-contributions/',
    WORD_CONTRIBUTION_UPVOTE: (id) => `/word-contributions/${id}/upvote/`,
    ANNOTATION_REQUESTS: '/annotation-requests/',
    ANNOTATION_REQUEST_REVIEW: (id) => `/annotation-requests/${id}/review/`,
    ANNOTATION_REQUEST_PARTIAL_REVIEW: (id) => `/annotation-requests/${id}/partial_review/`,
};

export const ROLES = {
    USER: 'user',
    LABEL: 'label',
};

export const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi (हिन्दी)' },
    { code: 'mr', label: 'Marathi (मराठी)' },
    { code: 'ta', label: 'Tamil (தமிழ்)' },
    { code: 'bn', label: 'Bengali (বাংলা)' },
];
