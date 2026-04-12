import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
    Music,
    Search,
    User,
    Languages,
    BookOpen,
    LayoutDashboard,
    PlusCircle,
    Bell,
    Pen,
    SearchIcon
} from 'lucide-react';

export default function Navbar() {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const navLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Explore', path: '/explore', icon: SearchIcon },
        { name: 'LyricWiki', path: '/lyricwiki', icon: BookOpen },
        { name: 'Create Song', path: '/contribute', icon: PlusCircle },
        { name: 'Annotations', path: '/annotations', icon: Pen },
    ];

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex justify-between items-center h-20">

                    {/* Left Side */}
                    <div className="flex items-center gap-10">

                        {/* Logo */}
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2 group cursor-pointer">
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-xl group-hover:shadow-lg group-hover:shadow-indigo-200 transition-all">
                                <Music size={24} strokeWidth={2.5} />
                            </div>

                            <span className="text-2xl font-extrabold tracking-tight text-slate-900 hidden sm:block">
                                Lyricsverse
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex space-x-8 h-20">
                            {navLinks.map((item) => {
                                const isActive = location.pathname === item.path;

                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        className={`inline-flex items-center gap-2 px-1 border-b-2 text-sm font-semibold transition-all duration-200 ${isActive
                                                ? "border-indigo-600 text-indigo-600"
                                                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                                            }`}
                                    >
                                        <item.icon
                                            size={18}
                                            className={isActive ? "text-indigo-600" : "text-slate-400"}
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition"
                        >
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* Profile */}
                        <Link
                            to="/profile"
                            className="flex items-center gap-3 p-1 pr-3 rounded-full border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all cursor-pointer"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
                                <User size={16} strokeWidth={2.5} />
                            </div>

                            <span className="text-sm font-semibold text-slate-700 hidden lg:block">
                                My Profile
                            </span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="px-6 pb-6 pt-2 space-y-4 bg-white border-t border-slate-200">
                    {navLinks.map((item) => {
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center gap-3 text-sm font-semibold p-2 rounded-lg transition ${isActive
                                        ? "text-indigo-600 bg-indigo-50"
                                        : "text-slate-600 hover:bg-slate-100"
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}