import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { 
  GraduationCap, 
  School, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  UserPlus,
  LogIn
} from 'lucide-react';

export const AuthPortal: React.FC = () => {
  const { login, register } = useAuth();

  // Role selection: 'faculty' or 'student'
  const [activeRole, setActiveRole] = useState<'faculty' | 'student'>('faculty');
  const [formMode, setFormMode] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('Computer Science & Engineering');
  const [regYearClass, setRegYearClass] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const isFaculty = activeRole === 'faculty';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const email = loginEmail.trim();
    const password = loginPassword;

    if (!email || !password) {
      setLoginError('Please enter both email and password.');
      return;
    }

    setLoginLoading(true);
    const res = await login(email, password);
    setLoginLoading(false);

    if (!res.success) {
      setLoginError(res.message || 'Invalid email or password.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setRegError('Please fill in all required fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    if (regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }

    setRegLoading(true);
    const res = await register({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      confirmPassword: regConfirmPassword,
      role: activeRole,
      department: regDepartment.trim(),
      year_class: regYearClass.trim() || (isFaculty ? 'Faculty In-Charge' : 'III Year CSE'),
    });
    setRegLoading(false);

    if (res.success) {
      setRegSuccess('Registration successful! You may now sign in with your credentials.');
      setLoginEmail(regEmail.trim());
      setLoginPassword(regPassword);
      setFormMode('login');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegYearClass('');
    } else {
      setRegError(res.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white shadow-md transition-colors ${
            isFaculty ? 'bg-indigo-600 shadow-indigo-100' : 'bg-emerald-600 shadow-emerald-100'
          }`}>
            {isFaculty ? <School className="w-8 h-8" /> : <GraduationCap className="w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Assignment Submission System
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Institutional portal for faculty management & student assessment submissions
          </p>
        </div>

        {/* 1. Primary Role Selection: Faculty Login vs Student Login */}
        <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-xs flex items-center">
          <button
            type="button"
            onClick={() => {
              setActiveRole('faculty');
              setLoginError(null);
              setRegError(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isFaculty
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Faculty Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole('student');
              setLoginError(null);
              setRegError(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !isFaculty
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Login</span>
          </button>
        </div>

        {/* 2. Secondary Mode Selector: Sign In vs Register */}
        <div className="flex items-center justify-center p-1 bg-slate-200/60 rounded-xl max-w-xs mx-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setFormMode('login');
              setLoginError(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              formMode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFormMode('register');
              setRegError(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              formMode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* 3. Main Form Container */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          {formMode === 'login' ? (
            /* ======================================================== */
            /* LOGIN FORM                                               */
            /* ======================================================== */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isFaculty ? 'Faculty Sign In' : 'Student Sign In'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isFaculty
                    ? 'Enter your faculty email and password to access the portal.'
                    : 'Enter your registered student email and password.'}
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={isFaculty ? 'faculty@college.edu' : 'student@college.edu'}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 ${
                  isFaculty ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loginLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{isFaculty ? 'Sign In as Faculty' : 'Sign In as Student'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Prominent link to Register */}
              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500 mb-2">
                  {isFaculty
                    ? "New faculty member? Don't have an account?"
                    : "Not registered as a student yet?"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormMode('register');
                    setLoginError(null);
                    setRegError(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isFaculty
                      ? 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                      : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>
                    {isFaculty ? 'Register as Faculty' : 'Register as Student (பதிவு செய்க)'}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            /* ======================================================== */
            /* REGISTER FORM                                            */
            /* ======================================================== */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isFaculty ? 'Create Faculty Account' : 'Register New Student'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isFaculty
                    ? 'Register your faculty account to manage assignments.'
                    : 'Register your student account to submit assignments.'}
                </p>
              </div>

              {regError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={isFaculty ? 'Dr. / Prof. Name' : 'Student Name (e.g. கலையரசி)'}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={isFaculty ? 'faculty@college.edu' : 'student@college.edu'}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {isFaculty ? 'Designation' : 'Class / Year'}
                  </label>
                  <input
                    type="text"
                    value={regYearClass}
                    onChange={(e) => setRegYearClass(e.target.value)}
                    placeholder={isFaculty ? 'Assistant Professor' : 'III Year CSE'}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 4 chars"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 ${
                  isFaculty ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {regLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{isFaculty ? 'Complete Faculty Registration' : 'Complete Student Registration'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setFormMode('login');
                    setRegError(null);
                    setLoginError(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
                >
                  Already have an account? <span className="underline">Sign in instead</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
