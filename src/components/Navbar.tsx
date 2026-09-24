import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  GraduationCap, 
  School, 
  LayoutDashboard, 
  BookOpen, 
  CheckCircle2, 
  User as UserIcon, 
  LogOut,
  ChevronDown,
  Users
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isFaculty = user.role === 'faculty';

  const facultyNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assessments', label: 'Assessments', icon: BookOpen },
    { id: 'submissions', label: 'Submissions', icon: CheckCircle2 },
    { id: 'students', label: 'Student List', icon: Users },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assessments', label: 'My Assessments', icon: BookOpen },
    { id: 'submissions', label: 'My Submissions', icon: CheckCircle2 },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const navItems = isFaculty ? facultyNavItems : studentNavItems;

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs ${
              isFaculty ? 'bg-indigo-600 shadow-indigo-100' : 'bg-emerald-600 shadow-emerald-100'
            }`}>
              {isFaculty ? <School className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-slate-900 block leading-tight">
                Student Assignment System
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                isFaculty ? 'text-indigo-600' : 'text-emerald-600'
              }`}>
                {isFaculty ? 'Faculty Portal' : 'Student Portal'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? isFaculty
                        ? 'bg-indigo-50 text-indigo-700 font-black ring-1 ring-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 font-black ring-1 ring-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? (isFaculty ? 'text-indigo-600' : 'text-emerald-600') : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile Pill & Prominent Logout */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100/60 transition-colors cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">{user.email}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                isFaculty ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {user.role}
              </span>
            </div>

            {/* Clear, Prominent Log Out Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-slate-100 overflow-x-auto gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex-1 py-1.5 px-1 text-center flex flex-col items-center gap-1 text-[11px] font-bold rounded-lg cursor-pointer shrink-0 ${
                  isActive
                    ? isFaculty
                      ? 'text-indigo-700 bg-indigo-50'
                      : 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
