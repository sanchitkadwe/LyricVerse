import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Music, 
  User, 
  LayoutDashboard,
  FileCheck,
  BookCheck,
  Users,
  Shield
} from 'lucide-react';

export default function AdminNavbar() {
  const location = useLocation();

  const navLinks = [
    { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Lyrics Verification', path: '/admin/lyrics', icon: FileCheck },
    { name: 'Wiki Approvals', path: '/admin/annotations', icon: BookCheck },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          <div className="flex items-center gap-10">

            <Link to="/admin/dashboard" className="flex-shrink-0 flex items-center gap-2 group cursor-pointer">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-xl group-hover:shadow-lg group-hover:shadow-indigo-200 transition-all">
                <Music size={24} strokeWidth={2.5} />
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Lyricsverse
                </span>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-indigo-200">
                  Admin
                </span>
              </div>
            </Link>

            <div className="hidden md:flex space-x-8 h-20">
              {navLinks.map((item) => {
                const isActive = location.pathname.includes(item.path);
                
                return (
                  <Link 
                    key={item.name} 
                    to={item.path} 
                    className={`inline-flex items-center gap-2 px-1 border-b-2 text-sm font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <item.icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">

            <Link to="/profile" className="flex items-center gap-3 p-1 pr-3 rounded-full border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-white shadow-sm">
                <Shield size={14} strokeWidth={2.5} />
              </div>
              <div className="hidden lg:flex flex-col">
                <span className="text-sm font-semibold text-slate-700 leading-none">Admin Panel</span>
              </div>
            </Link>

          </div>

        </div>
      </div>
    </nav>
  );
}