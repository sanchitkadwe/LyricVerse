import React from 'react';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';

export default function BaseNavbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          <Link to="/" className="flex items-center gap-12 group focus:outline-none">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-xl group-hover:shadow-lg group-hover:shadow-indigo-200 transition-all duration-300">
                <Music size={24} strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-900 transition-colors">
                LyricVerse
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="hidden sm:block text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors"
            >
              Sign Up
            </Link>
            <Link
              to="/login"
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Log In
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}