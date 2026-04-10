import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BASE_URL, API_ENDPOINTS } from '../utils/constants.js';
import axios from 'axios';
import Navbar from '../components/Navbar';

import {
    User, Mail, Globe2, Bell, Shield, Trash2, LogOut,
    AlertTriangle, X, Camera, ArrowLeft, CheckCircle2, Star
} from 'lucide-react';

export default function Profile() {
    const navigate = useNavigate();

    // Modals & Feedback State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState(''); // Gives feedback when saving

    // Real User Data State (matching your Django Model)
    const [user, setUser] = useState({
        id: null,
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        bio: '',
        rating: null,
        preferred_language: 'en',
        role:''
    });

    // --- 1. FETCH PROFILE DATA ON LOAD ---
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileResponse = await axios.get(BASE_URL + API_ENDPOINTS.PROFILE, {
                    withCredentials: true // Sends the secure cookies
                });
                // Populate the state with database values
                setUser({
                    id: profileResponse.data.id,
                    username: profileResponse.data.username || '',
                    first_name: profileResponse.data.first_name || '',
                    last_name: profileResponse.data.last_name || '',
                    email: profileResponse.data.email || '',
                    bio: profileResponse.data.bio || '',
                    rating: profileResponse.data.rating ?? null,
                    preferred_language: profileResponse.data.preferred_language || 'en',
                    role: profileResponse.data.role || ''
                });
            } catch (error) {
                console.error("Error fetching profile:", error);
                // If unauthorized (token expired/missing), kick them to login
                if (error.response?.status === 401) {
                    navigate('/login');
                }
            }
        };
        fetchProfile();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await axios.post(BASE_URL + API_ENDPOINTS.LOGOUT, {}, {
                withCredentials: true
            });
            navigate('/'); // Send back to auth page
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaveStatus('Saving...');
        try {
            await axios.patch(BASE_URL + API_ENDPOINTS.PROFILE, {
                email: user.email,
                bio: user.bio,
                preferred_language: user.preferred_language
            }, {
                withCredentials: true
            });
            setSaveStatus('Changes saved successfully!');
            setTimeout(() => setSaveStatus(''), 3000); // Clear message after 3 seconds
        } catch (error) {
            console.error("Error saving profile:", error);
            setSaveStatus('Failed to save changes.');
        }
    };

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Loading...';
    const userRating = Number(user.rating) || 0;

    const handleDeleteAccount = async () => {
        try {
            // Django's ModelViewSet automatically creates a DELETE endpoint at /api/users/<id>/
            await axios.delete(`${BASE_URL}${API_ENDPOINTS.USER}${user.id}/`, {
                withCredentials: true
            });
            setIsDeleteDialogOpen(false);
            navigate('/login'); // Redirect to login after deletion
        } catch (error) {
            console.error("Failed to delete account", error);
            alert("Could not delete account. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 font-sans pb-20 relative flex flex-col">
            <style>{`
        @keyframes modalScale {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal {
          animation: modalScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

            <Navbar />

            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40"></div>
            </div>

            <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-slate-200/60 py-4">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900">Account Settings</h1>
                    </div>
                    <button
                        onClick={handleLogout} // Attached Logout logic here
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                    >
                        <LogOut size={16} />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 w-full mt-8 flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                    <div className="md:col-span-4 flex flex-col gap-6">
                        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                            <div className="relative mb-4 group cursor-pointer">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-violet-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                                    <User size={40} className="text-indigo-400" />
                                </div>
                                <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera size={24} className="text-white" />
                                </div>
                            </div>
                            <h2 className="text-xl font-extrabold text-slate-900">{fullName}</h2>
                            <p className="text-sm text-slate-500 mb-4">{user.email || '...'}</p>
                            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200/50">
                                <CheckCircle2 size={14} /> {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                            </div>
                            <div className="mt-4 flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 border border-amber-200/70">
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={13}
                                            className={star <= Math.round(userRating) ? 'fill-amber-500 text-amber-500' : 'text-amber-200'}
                                        />
                                    ))}
                                </div>
                                <span>{userRating ? userRating.toFixed(1) : 'No rating yet'}</span>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-2 shadow-sm flex flex-col">
                            <button className="flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold transition-colors">
                                <User size={18} /> Profile Details
                            </button>
                            {/* <button className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-sm font-medium transition-colors">
                                <Shield size={18} /> Password & Security
                            </button> */}
                        </div>
                    </div>

                    <div className="md:col-span-8 flex flex-col gap-8">

                        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-6 sm:p-8 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-extrabold text-slate-900">Personal Information</h3>
                                {saveStatus && (
                                    <span className={`text-sm font-bold ${saveStatus.includes('Failed') ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {saveStatus}
                                    </span>
                                )}
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={user.username}
                                                disabled
                                                className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">First Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={user.first_name}
                                                disabled
                                                className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Last Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={user.last_name}
                                                disabled
                                                className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="email"
                                                value={user.email}
                                                onChange={(e) => setUser({ ...user, email: e.target.value })}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Short Bio</label>
                                    <textarea
                                        rows="3"
                                        value={user.bio}
                                        onChange={(e) => setUser({ ...user, bio: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium resize-none focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                                    ></textarea>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-6 sm:p-8 shadow-sm">
                            <h3 className="text-lg font-extrabold text-slate-900 mb-6">App Preferences</h3>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Globe2 size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">Default Translation</h4>
                                            <p className="text-xs text-slate-500">Your primary language for the editor.</p>
                                        </div>
                                    </div>
                                    {/* Linked Dropdown to Django Database values */}
                                    <select
                                        value={user.preferred_language}
                                        onChange={(e) => setUser({ ...user, preferred_language: e.target.value })}
                                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                                    >
                                        <option value="en">English</option>
                                        <option value="hi">Hindi (हिन्दी)</option>
                                        <option value="mr">Marathi (मराठी)</option>
                                        <option value="ta">Tamil (தமிழ்)</option>
                                        <option value="bn">Bengali (বাংলা)</option>
                                    </select>
                                </div>
                                <div className="border-t border-slate-100"></div>

                            </div>
                        </div>

                        <div className="border border-red-200 bg-red-50/50 rounded-2xl p-6 sm:p-8 shadow-sm">
                            <h3 className="text-lg font-extrabold text-red-700 mb-2">Danger Zone</h3>
                            <p className="text-sm text-red-600/80 mb-6 leading-relaxed">
                                Permanently delete your account and all of your lyrics, translations, and wiki contributions. This action cannot be undone.
                            </p>
                            <button
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="flex items-center gap-2 bg-white border-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
                            >
                                <Trash2 size={16} />
                                Delete Account
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {isDeleteDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsDeleteDialogOpen(false)}
                    ></div>

                    <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-6 sm:p-8 animate-modal border border-red-100">

                        <button
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 border-4 border-red-50">
                                <AlertTriangle size={32} className="text-red-600" />
                            </div>

                            <h3 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
                                Delete Account
                            </h3>

                            <p className="text-slate-500 mb-6 leading-relaxed text-sm">
                                You are about to permanently delete your account. All your data, including songs and translations, will be erased.
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setIsDeleteDialogOpen(false)}
                                    className="flex-1 py-3.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold transition-colors border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex-1 py-3.5 px-4 rounded-xl text-sm font-bold shadow-md transition-all bg-red-600 hover:bg-red-700 text-white cursor-pointer hover:shadow-lg"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
