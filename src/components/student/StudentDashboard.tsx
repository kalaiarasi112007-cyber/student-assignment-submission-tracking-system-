import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { DashboardSummary, Assessment } from '../../types.ts';
import { apiFetch, safeJson } from '../../lib/api.ts';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  UploadCloud, 
  ArrowRight, 
  RefreshCw,
  Calendar,
  UserCheck
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenSubmitModal?: (assessment: Assessment) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onOpenSubmitModal
}) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>({
    totalAssessments: 0,
    pending: 0,
    submitted: 0,
    late: 0
  });
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/student/dashboard');
      const data = await safeJson(res);
      if (data.success) {
        setSummary(data.summary);
        setAssessments(data.assessments || []);
      }
    } catch (err) {
      console.error('Error fetching student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Student Portal</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Welcome, {user?.name || 'Student'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {user?.year_class || 'III Year CSE'} • {user?.department || 'Computer Science & Engineering'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('assessments')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>My Assessments</span>
          </button>
          <button
            onClick={() => onNavigate('submissions')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Submissions History</span>
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-slate-600" />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Received</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{summary.totalAssessments}</div>
          <p className="text-[11px] text-slate-400 mt-1">Assigned to you</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{summary.pending || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting your solution</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{summary.submitted || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Submitted on time</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Late Submissions</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{summary.late || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Turned in past deadline</p>
        </div>
      </div>

      {/* My Assessments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Assessments</h2>
            <p className="text-xs text-slate-500">Assignments pushed to your account by faculty</p>
          </div>
          <button
            onClick={() => onNavigate('assessments')}
            className="text-xs text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
            <span>Loading assessments...</span>
          </div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No assessments assigned yet</p>
            <p className="text-xs text-slate-400 mt-1">
              When faculty pushes an assessment to your account, it will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Assessment</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.map((a) => {
                  const isSubmitted = a.status === 'Submitted';
                  const isLate = a.status === 'Late';
                  const isPending = a.status === 'Pending' || !a.status;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {a.title}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {a.subject}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {a.faculty_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 flex items-center gap-1.5 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{a.deadline}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isSubmitted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Submitted</span>
                          </span>
                        )}
                        {isLate && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Late</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (onOpenSubmitModal) {
                              onOpenSubmitModal(a);
                            } else {
                              onNavigate('assessments');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isPending
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {isPending ? 'Submit' : 'View / Resubmit'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
