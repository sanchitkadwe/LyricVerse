// src/utils/constants.js

export const BASE_URL = 'http://localhost:8000/api'

export const API_ENDPOINTS = {
    LOGIN: '/user/login/',
    SIGNUP: '/user/signup/',
    LOGOUT: '/user/logout/',
    PROFILE: '/user/profile/',
    USER: '/user/',
    SONGS: '/song/',
    MY_SONGS: '/song/mine/',
    SONG_SUBMIT: (songId) => `/song/${songId}/submit/`,
    SONG_FINAL_PUBLISH: (songId) => `/song/${songId}/final_publish/`,
    LANGUAGES: '/languages/',
    GENRES: '/genre/',
    DICTIONARY: '/dictionary/',
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
