import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { 
  User, 
  Mail, 
  Building, 
  GraduationCap, 
  School, 
  ShieldCheck, 
  Calendar, 
  LogOut,
  Hash
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const isFaculty = user.role === 'faculty';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Account Overview</span>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
          {isFaculty ? 'Faculty Profile' : 'Student Profile'}
        </h1>
        <p className="text-xs text-slate-500">
          Your institutional registration and portal details
        </p>
      </div>

      {/* Main Profile Identity Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Banner / Header */}
        <div className={`p-6 text-white flex items-center justify-between ${
          isFaculty ? 'bg-indigo-600' : 'bg-emerald-600'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/25">
              {isFaculty ? <School className="w-8 h-8" /> : <GraduationCap className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/25 text-white">
                  {isFaculty ? 'Faculty Member' : 'Enrolled Student'}
                </span>
              </div>
              <p className="text-xs text-white/80 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 divide-y divide-slate-100 text-xs">
          <div className="py-3.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>Full Name</span>
            </span>
            <span className="font-bold text-slate-900 text-sm">{user.name}</span>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>Email Address</span>
            </span>
            <span className="font-mono text-slate-800">{user.email}</span>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Portal Role</span>
            </span>
            <span className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wider text-[11px] ${
              isFaculty ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {isFaculty ? 'Faculty' : 'Student'}
            </span>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              <span>Department</span>
            </span>
            <span className="font-semibold text-slate-800">{user.department || 'Computer Science & Engineering'}</span>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-400" />
              <span>Class / Designation</span>
            </span>
            <span className="font-semibold text-slate-800">{user.year_class || (isFaculty ? 'Faculty In-Charge' : 'III Year CSE')}</span>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-400" />
              <span>User ID</span>
            </span>
            <span className="font-mono text-slate-600 font-bold">#{user.id}</span>
          </div>

          {user.created_at && (
            <div className="py-3.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Joined Date</span>
              </span>
              <span className="text-slate-600">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Account Session & Prominent Log Out Card */}
      <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Sign Out of Portal</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click the button to securely sign out of your current session.
          </p>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-md shadow-rose-200 transition-all cursor-pointer hover:scale-[1.02]"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
