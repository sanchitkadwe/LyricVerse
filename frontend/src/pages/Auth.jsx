import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast.jsx';
import { BASE_URL, API_ENDPOINTS, ROLES, LANGUAGES } from '../utils/constants.js';
import {
    Music, Mail, Lock, User, ArrowRight, Sparkles,
    Globe, FileText, AtSign, AlertCircle, Eye, EyeOff
} from 'lucide-react';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        preferredLanguage: 'en',
        bio: ''
    });

    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
        setServerError('');
    };

    // Toggle Login/Signup
    const toggleAuthMode = (e) => {
        e.preventDefault();
        setIsLogin(!isLogin);
        setErrors({});
        setServerError('');
    };
    const validateForm = () => {
        let newErrors = {};
        if (isLogin) {
            if (!formData.username) newErrors.username = "Username is required";
            if (!formData.password) newErrors.password = "Password is required";
        }
        else {
            if (!formData.firstName) newErrors.firstName = "First name required";
            if (!formData.lastName) newErrors.lastName = "Last name required";
            if (!formData.username) newErrors.username = "Username required";
            if (!formData.email) {
                newErrors.email = "Email required";
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = "Email format is invalid";
            }
            if (!formData.password) {
                newErrors.password = "Password required";
            } else if (formData.password.length < 6) {
                newErrors.password = "Password must be at least 6 characters";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // Returns true if no errors
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setServerError('');

        try {
            if (isLogin) {
                const response = await axios.post(BASE_URL + API_ENDPOINTS.LOGIN, {
                    username: formData.username,
                    password: formData.password
                }, {
                    withCredentials: true
                });

                addToast({
                    type: 'success',
                    title: 'Logged in successfully!',
                    description: 'You have been logged in.'
                });

                const { role } = response.data;
                navigate('/dashboard/');

                // Redirect based on role
                if (role === 'verifier') navigate('/admin/dashboard');
                else navigate('/dashboard');

            } else {
                const response = await axios.post(BASE_URL + API_ENDPOINTS.SIGNUP, {
                    username: formData.username,
                    password: formData.password,
                    email: formData.email,
                    preferred_language: formData.preferredLanguage,
                    bio: formData.bio
                });

                console.log("Signed up successfully!", response.data);
                setIsLogin(true);
                setServerError('Account created successfully! Please log in.');
            }
        } catch (error) {
            console.error("Auth error:", error);
            if (error.response && error.response.data) {
                setServerError(error.response.data.error || "An error occurred. Please try again.");
            } else {
                setServerError("Cannot connect to server.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 font-sans flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">

            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-60"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-60"></div>
            </div>

            <div className="w-full max-w-5xl bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 overflow-hidden flex flex-col lg:flex-row relative z-10 animate-fade-up min-h-[650px]">

                <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative transition-all duration-500">

                    <div className="flex items-center gap-2 mb-8 cursor-pointer w-fit">
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-xl shadow-sm">
                            <Music size={20} strokeWidth={2.5} />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-slate-900">
                            Lyricsverse
                        </span>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
                            {isLogin ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p className="text-slate-500 text-sm sm:text-base">
                            {isLogin
                                ? 'Enter your details to access your creative workspace.'
                                : 'Join songwriters worldwide and break language barriers.'}
                        </p>
                    </div>

                    {serverError && (
                        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${serverError.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            <AlertCircle size={16} />
                            {serverError}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>


                        {!isLogin && (
                            <div className="space-y-4 animate-fade-up" style={{ animationDuration: '0.4s' }}>


                                <div className="flex gap-4">
                                    <div className="w-1/2 relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange}
                                            className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${errors.firstName ? 'border-red-400' : 'border-slate-200'} rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all duration-300`}
                                        />
                                    </div>
                                    <div className="w-1/2 relative">
                                        <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border ${errors.lastName ? 'border-red-400' : 'border-slate-200'} rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all duration-300`}
                                        />
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input type="email" name="email" placeholder="Email address" value={formData.email} onChange={handleChange}
                                        className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${errors.email ? 'border-red-400' : 'border-slate-200'} rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all duration-300`}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
                                </div>
                            </div>
                        )}


                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <AtSign className="h-5 w-5 text-slate-400" />
                            </div>
                            <input type="text" name="username" placeholder={isLogin ? "Email" : "Choose a Username"} value={formData.username} onChange={handleChange}
                                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${errors.username ? 'border-red-400' : 'border-slate-200'} rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all duration-300`}
                            />
                            {errors.username && <p className="text-red-500 text-xs mt-1 ml-1">{errors.username}</p>}
                        </div>


                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>

                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}

                                className={`w-full pl-11 pr-12 py-3 bg-slate-50 border ${errors.password ? 'border-red-400' : 'border-slate-200'} rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all duration-300`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>

                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
                        {!isLogin && (
                            <div className="space-y-4 animate-fade-up" style={{ animationDuration: '0.6s' }}>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Globe className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <select name="preferredLanguage" value={formData.preferredLanguage} onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all duration-300 appearance-none"
                                    >
                                        <option value="en">English</option>
                                        <option value="hi">Hindi (हिन्दी)</option>
                                        <option value="mr">Marathi (मराठी)</option>
                                        <option value="ta">Tamil (தமிழ்)</option>
                                        <option value="bn">Bengali (বাংলা)</option>
                                    </select>
                                </div>
                                <div className="relative">
                                    <div className="absolute top-3 left-0 pl-4 pointer-events-none">
                                        <FileText className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <textarea name="bio" placeholder="Short Bio (Optional)" value={formData.bio} onChange={handleChange} rows="2"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all duration-300 resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {isLogin && (
                            <div className="flex justify-end mt-1">
                                <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white py-3.5 rounded-xl text-base font-semibold shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 mt-4"
                        >
                            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                            {!isLoading && <ArrowRight size={18} />}
                        </button>
                    </form>

    
                    <p className="text-center mt-6 text-slate-500 font-medium">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={toggleAuthMode}
                            className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors focus:outline-none underline decoration-indigo-200 hover:decoration-indigo-600 underline-offset-4"
                        >
                            {isLogin ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </div>

                <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 to-violet-700 p-12 relative overflow-hidden flex-col justify-between">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-900/30 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold mb-6 backdrop-blur-md">
                            <Sparkles size={16} className="text-indigo-200" />
                            <span>Join creators</span>
                        </div>
                        <h3 className="text-4xl font-extrabold text-white leading-[1.2] tracking-tight mb-6">
                            Your words.<br />
                            Translated into<br />
                            pure emotion.
                        </h3>
                    </div>

                    <div className="relative z-10 bg-white/10 border border-white/20 backdrop-blur-xl p-6 rounded-2xl shadow-2xl">
                        <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <p className="text-indigo-50 font-medium leading-relaxed mb-4">
                            "An outstanding course project. Lyricsverse brilliantly solves the complex challenge of translating English songwriting into Hindi and Marathi while preserving the cultural soul."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-300 border-2 border-white/50 flex items-center justify-center text-indigo-900 font-bold">
                                SK
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">Sanchit Kadwe</p>
                                <p className="text-indigo-200 text-xs font-medium">CSE Student</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}