import React, { useState, useEffect } from 'react';
import { Assessment, Submission } from '../../types.ts';
import { apiFetch, safeJson } from '../../lib/api.ts';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Filter, 
  BookOpen,
  Calendar,
  Eye
} from 'lucide-react';

interface FacultySubmissionsProps {
  initialAssessmentId?: number | null;
}

export const FacultySubmissions: React.FC<FacultySubmissionsProps> = ({
  initialAssessmentId
}) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(initialAssessmentId || null);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Submitted' | 'Pending' | 'Late'>('All');
  const [loading, setLoading] = useState(true);

  // Fetch list of assessments created by this faculty
  const fetchAssessments = async () => {
    try {
      const res = await apiFetch('/api/faculty/assessments');
      const data = await safeJson(res);
      if (data.success && Array.isArray(data.assessments)) {
        setAssessments(data.assessments);
        if (!selectedAssessmentId && data.assessments.length > 0) {
          setSelectedAssessmentId(data.assessments[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
    }
  };

  // Fetch submissions for the selected assessment
  const fetchSubmissionsForAssessment = async (assessmentId: number) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/faculty/assessments/${assessmentId}/submissions`);
      const data = await safeJson(res);
      if (data.success) {
        setCurrentAssessment(data.assessment);
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error('Error fetching assessment submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  useEffect(() => {
    if (selectedAssessmentId) {
      fetchSubmissionsForAssessment(selectedAssessmentId);
    } else {
      setLoading(false);
    }
  }, [selectedAssessmentId]);

  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter === 'All') return true;
    return s.status === statusFilter;
  });

  const totalAssigned = submissions.length;
  const submittedCount = submissions.filter((s) => s.status === 'Submitted').length;
  const lateCount = submissions.filter((s) => s.status === 'Late').length;
  const pendingCount = submissions.filter((s) => s.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Header and Assessment Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Submissions Tracker</h1>
          <p className="text-xs text-slate-500">
            Track student submission status, review files, and audit deadlines
          </p>
        </div>

        {assessments.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Select Assessment:</span>
            <select
              value={selectedAssessmentId || ''}
              onChange={(e) => setSelectedAssessmentId(parseInt(e.target.value, 10))}
              className="py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.subject})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {assessments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No assessments created yet</p>
          <p className="text-xs text-slate-400 mt-1">Create an assessment to start tracking student submissions</p>
        </div>
      ) : (
        <>
          {/* Current Assessment Summary Banner */}
          {currentAssessment && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{currentAssessment.title}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                    {currentAssessment.subject}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{currentAssessment.description}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Deadline: <strong className="text-slate-700">{currentAssessment.deadline}</strong></span>
                  </span>
                </div>
              </div>

              {/* Status breakdown pills */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStatusFilter('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({totalAssigned})
                </button>
                <button
                  onClick={() => setStatusFilter('Submitted')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'Submitted' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Submitted ({submittedCount})
                </button>
                <button
                  onClick={() => setStatusFilter('Late')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'Late' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Late ({lateCount})
                </button>
                <button
                  onClick={() => setStatusFilter('Pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'Pending' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
              </div>
            </div>
          )}

          {/* Submissions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Assigned Students Tracking ({filteredSubmissions.length})
              </span>
              <button
                onClick={() => selectedAssessmentId && fetchSubmissionsForAssessment(selectedAssessmentId)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                <span>Loading submissions...</span>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No submissions found</p>
                <p className="text-xs text-slate-400 mt-1">No students match the current status filter</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Submitted At</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubmissions.map((s) => {
                      const isSubmitted = s.status === 'Submitted';
                      const isLate = s.status === 'Late';
                      const isPending = s.status === 'Pending';

                      return (
                        <tr key={s.student_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {s.student_name}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">
                            {s.student_email}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {s.student_class || 'III Year CSE'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {s.submitted_at || '—'}
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
                            {s.file_path ? (
                              <a
                                href={`/api/files/${s.file_path}`}
                                download={s.file_name}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                title={`Download ${s.file_name}`}
                              >
                                <Download className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Download</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
