import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { DashboardSummary, Assessment } from '../../types.ts';
import { apiFetch, safeJson } from '../../lib/api.ts';
import { 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  FileText, 
  UserCheck, 
  ArrowRight, 
  RefreshCw,
  Calendar
} from 'lucide-react';

interface FacultyDashboardProps {
  onNavigate: (tab: string) => void;
  onSelectAssessmentForTracking?: (assessmentId: number) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  onNavigate,
  onSelectAssessmentForTracking
}) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>({
    totalAssessments: 0,
    totalStudents: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0
  });
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/faculty/dashboard');
      const data = await safeJson(res);
      if (data.success) {
        setSummary(data.summary);
        setRecentAssessments(data.recentAssessments || []);
      }
    } catch (err) {
      console.error('Error fetching faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Faculty Portal</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Welcome, {user?.name || 'Faculty Member'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department of {user?.department || 'Computer Science & Engineering'} • Manage assessments and track student submissions
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('assessments')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Assessment</span>
          </button>
          <button
            onClick={() => onNavigate('submissions')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Student Submissions</span>
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
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Assessments</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{summary.totalAssessments}</div>
          <p className="text-[11px] text-slate-400 mt-1">Created & pushed by you</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Students</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{summary.totalStudents}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across active assessments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Submissions</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{summary.totalSubmissions}</div>
          <p className="text-[11px] text-slate-400 mt-1">Submitted student solutions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Submissions</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{summary.pendingSubmissions}</div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting student upload</p>
        </div>
      </div>

      {/* Recent Assessments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Assessments</h2>
            <p className="text-xs text-slate-500">Assessments pushed to enrolled students</p>
          </div>
          <button
            onClick={() => onNavigate('assessments')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
            <span>Loading assessment data...</span>
          </div>
        ) : recentAssessments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No assessments created yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Create Assessment" to push your first assignment to students</p>
            <button
              onClick={() => onNavigate('assessments')}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Create Assessment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Assessment Title</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Submissions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAssessments.map((a) => {
                  const assigned = a.assigned_count || 0;
                  const submitted = a.submitted_count || 0;
                  const rate = assigned > 0 ? Math.round((submitted / assigned) * 100) : 0;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {a.title}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {a.subject}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 flex items-center gap-1.5 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{a.deadline}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{submitted} / {assigned}</span>
                          <span className="text-[10px] text-slate-400">({rate}%)</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (onSelectAssessmentForTracking) {
                              onSelectAssessmentForTracking(a.id);
                            }
                            onNavigate('submissions');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          View Submissions
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
