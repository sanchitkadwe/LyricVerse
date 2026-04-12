import React from 'react';
import { Link } from 'react-router-dom';
import BaseNavbar from '../components/BaseNavbar.jsx';
import {
    Music,
    PenTool,
    Globe2,
    BookOpen,
    ArrowRight,
    PlayCircle,
    Sparkles,
    Twitter,
    Instagram,
    Github,
    Heart
} from 'lucide-react';
import Navbar from '../components/BaseNavbar';

export default function Home() {
    return (

        <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 font-sans flex flex-col">
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
                <div className="absolute top-40 -left-40 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
            </div>

            <BaseNavbar />
            {/* Hero Section */}
            <section className="relative z-10 pt-24 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16">

                        {/* Hero Content */}
                        <div className="lg:w-1/2 flex flex-col items-start text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8">
                                <Sparkles size={16} />
                                <span>The new standard for songwriting</span>
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
                                Create Songs <br /> That Speak <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">
                                    Across Languages
                                </span>
                            </h1>

                            <p className="text-lg text-slate-600 max-w-lg mb-10 leading-relaxed">
                                The ultimate multilingual songwriting platform. Write lyrics in English and instantly translate them into Hindi, Marathi, and other Indian languages while preserving cultural context.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all duration-300 transform hover:-translate-y-1">
                                    Start Journey Now
                                </button>
                            </div>
                        </div>

                        {/* Hero Visual */}
                        <div className="lg:w-1/2 relative w-full max-w-lg mx-auto lg:mx-0 mt-12 lg:mt-0">
                            <div className="relative w-full aspect-square">
                                {/* Background decorative card */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-[2.5rem] shadow-2xl transform rotate-6 scale-95 opacity-90 transition-transform hover:rotate-12 duration-700"></div>
                                {/* Foreground glass card */}
                                <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-xl transform -rotate-3 flex flex-col items-center justify-center p-8 transition-transform hover:-rotate-6 duration-700">
                                    {/* Floating Elements inside the card */}
                                    <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                                        <Globe2 className="text-indigo-600 w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Multilingual Magic</h3>
                                    <p className="text-slate-500 text-center mb-8">Seamlessly translate emotions, not just words.</p>
                                    <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">English</span>
                                            <ArrowRight size={14} className="text-indigo-400" />
                                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Hindi</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full w-full mb-2"></div>
                                        <div className="h-2 bg-slate-200 rounded-full w-4/5"></div>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 py-24 bg-white border-t border-slate-100 flex-grow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">
                            Toolkit
                        </h2>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">
                            Powerful Features for Modern Songwriters
                        </h3>
                        <p className="text-lg text-slate-600">
                            Everything you need to craft, translate, and refine your musical ideas in one elegant workspace.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Feature 1 */}
                        <div className="group bg-slate-50 hover:bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300">
                            <div className="w-14 h-14 bg-white border border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300">
                                <PenTool className="text-slate-700 group-hover:text-indigo-600 transition-colors" size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-3">Smart Lyric Editor</h4>
                            <p className="text-slate-600 leading-relaxed">
                                An intuitive, distraction-free writing environment with formatting tools, rhyme dictionaries, and auto-saving capabilities.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group bg-slate-50 hover:bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-violet-100 shadow-sm hover:shadow-xl hover:shadow-violet-100/50 transition-all duration-300">
                            <div className="w-14 h-14 bg-white border border-slate-200 group-hover:border-violet-200 group-hover:bg-violet-50 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300">
                                <Globe2 className="text-slate-700 group-hover:text-violet-600 transition-colors" size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-3">Contextual Translation</h4>
                            <p className="text-slate-600 leading-relaxed">
                                Real-time, culturally-aware translation into multiple Indian languages that preserves the soul and rhythm of your song.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group bg-slate-50 hover:bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-pink-100 shadow-sm hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300">
                            <div className="w-14 h-14 bg-white border border-slate-200 group-hover:border-pink-200 group-hover:bg-pink-50 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300">
                                <BookOpen className="text-slate-700 group-hover:text-pink-600 transition-colors" size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-3">Cultural Lyric Wiki</h4>
                            <p className="text-slate-600 leading-relaxed">
                                Annotate words and phrases with deep cultural meanings, idioms, and references to collaborate better with musicians.
                            </p>
                        </div>

                    </div>

                </div>
            </section>

            {/* Footer Section */}
            <footer className="bg-white border-t border-slate-200/60 pt-16 pb-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Main Content*/}
                    <div className="flex flex-col items-center text-center mb-12">

                        {/* Brand Logo & Name */}
                        <div className="flex items-center gap-2 mb-6 cursor-pointer">
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2.5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <Music size={22} strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                                Lyricsverse
                            </span>
                        </div>

                        {/* Description */}
                        <p className="text-slate-500 leading-relaxed max-w-md mb-8 text-sm md:text-base">
                            The ultimate multilingual songwriting platform. Break language barriers and let your music speak to the world.
                        </p>

                        {/* Social Links */}
                        <div className="flex space-x-6">
                            <a href="#" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all transform hover:scale-110 duration-200">
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="p-2 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-all transform hover:scale-110 duration-200">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all transform hover:scale-110 duration-200">
                                <Github size={20} />
                            </a>
                        </div>

                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-sm text-slate-400 font-medium text-center md:text-left">
                            © {new Date().getFullYear()} LyricsVerse. All rights reserved.
                        </p>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium bg-slate-50 px-5 py-2.5 rounded-full border border-slate-100 hover:bg-slate-100 transition-colors cursor-default">
                            <span>Made with</span>
                            <Heart size={14} className="text-pink-500 fill-pink-500 animate-pulse" />
                            <span>for songwriters everywhere.</span>
                        </div>
                    </div>

                </div>
            </footer>

        </div>
    );
}