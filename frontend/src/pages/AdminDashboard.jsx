import React, { useState } from 'react';
import AdminNavbar from '../components/AdminNavbar.jsx';
import { 
  Users, 
  Music, 
  BookOpen, 
  FileClock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  TrendingUp,
  AlertTriangle,
  MoreVertical,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function AdminDashboard() {
  const [pendingLyrics, setPendingLyrics] = useState([
    { id: 101, title: 'Echoes of Mumbai', artist: 'Jane Doe', language: 'Marathi', submittedBy: 'user_421', date: '2 hours ago', status: 'Pending' },
    { id: 102, title: 'Neon Lights', artist: 'The Wanderers', language: 'Hindi', submittedBy: 'user_89', date: '5 hours ago', status: 'Pending' },
    { id: 103, title: 'Desert Rose', artist: 'Priya Sharma', language: 'Punjabi', submittedBy: 'user_773', date: '1 day ago', status: 'Pending' },
  ]);
  const [pendingAnnotations, setPendingAnnotations] = useState([
    { id: 1, term: 'Nakhra', song: 'Neon Lights', user: 'music_lover99', meaning: 'Swagger or attitude, often playful.' },
    { id: 2, term: 'Jugaad', song: 'Echoes of Mumbai', user: 'mumbai_indie', meaning: 'A flexible approach to problem-solving.' },
  ]);
  const handleApproveLyric = (id) => {
    setPendingLyrics(pendingLyrics.filter(item => item.id !== id));
  };

  const handleRejectLyric = (id) => {
    setPendingLyrics(pendingLyrics.filter(item => item.id !== id));
  };

  return (

      <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 font-sans pb-20 relative">
        <AdminNavbar />
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-200/40 rounded-full mix-blend-multiply filter blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Platform Overview</h1>
            <p className="text-slate-500 mt-1">Monitor site activity, approve content, and manage users.</p>
          </div>
          <button className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all duration-300">
            <ShieldAlert size={16} className="text-amber-500" />
            Review Flagged Users
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Users', value: '12,450', trend: '+12% this week', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Published Songs', value: '45,210', trend: '+8% this week', icon: Music, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Pending Lyrics', value: pendingLyrics.length, trend: 'Needs review', icon: FileClock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Wiki Annotations', value: '8,904', trend: '+24% this week', icon: BookOpen, color: 'text-pink-600', bg: 'bg-pink-50' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon size={22} className={stat.color} />
                </div>
                {stat.trend.includes('+') && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    <TrendingUp size={12} /> {stat.trend.split(' ')[0]}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-slate-900 mb-1">{stat.value}</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                {!stat.trend.includes('+') && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">{stat.trend}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 sm:p-8 shadow-sm">
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <FileClock size={20} className="text-indigo-600" />
                  Pending Lyric Verifications
                </h2>
                <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                  View All
                </button>
              </div>

              {pendingLyrics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Song Details</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Language</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Submitted By</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLyrics.map((lyric) => (
                        <tr key={lyric.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                          <td className="py-4">
                            <p className="text-sm font-bold text-slate-900">{lyric.title}</p>
                            <p className="text-xs text-slate-500">{lyric.artist}</p>
                          </td>
                          <td className="py-4">
                            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md border border-indigo-100">
                              {lyric.language}
                            </span>
                          </td>
                          <td className="py-4">
                            <p className="text-sm font-medium text-slate-700">{lyric.submittedBy}</p>
                            <p className="text-xs text-slate-400">{lyric.date}</p>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all tooltip"
                                title="Review Content"
                              >
                                <Eye size={18} />
                              </button>
                              <button 
                                onClick={() => handleApproveLyric(lyric.id)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button 
                                onClick={() => handleRejectLyric(lyric.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
                  <p className="text-slate-500 text-sm">There are no pending lyric verifications at the moment.</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 shadow-sm">
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen size={20} className="text-pink-600" />
                  Wiki Approvals
                </h2>
              </div>

              <div className="space-y-4">
                {pendingAnnotations.map((annotation) => (
                  <div key={annotation.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-pink-200 hover:bg-pink-50/30 transition-all group cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        "{annotation.term}"
                      </h4>
                      <button className="text-slate-400 hover:text-slate-700">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Song: <span className="text-slate-700">{annotation.song}</span></p>
                    <p className="text-sm text-slate-700 mb-4 italic border-l-2 border-pink-200 pl-3 leading-relaxed">
                      {annotation.meaning}
                    </p>
                    <div className="flex gap-2 w-full">
                      <button className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 rounded-lg text-xs font-bold transition-all">
                        Reject
                      </button>
                      <button className="flex-1 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold shadow-sm transition-all">
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors py-2">
                View all pending wiki terms <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}