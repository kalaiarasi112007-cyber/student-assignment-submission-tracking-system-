import React, { useState, useEffect } from 'react';
import { Assessment } from '../../types.ts';
import { apiFetch, safeJson } from '../../lib/api.ts';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Paperclip, 
  UploadCloud, 
  RefreshCw, 
  X,
  FileCheck,
  Download,
  AlertCircle
} from 'lucide-react';

interface StudentAssessmentsProps {
  preselectedAssessment?: Assessment | null;
  onClearPreselected?: () => void;
}

export const StudentAssessments: React.FC<StudentAssessmentsProps> = ({
  preselectedAssessment,
  onClearPreselected
}) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Submitted'>('All');

  // Submit Modal States
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(preselectedAssessment || null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/student/assessments');
      const data = await safeJson(res);
      if (data.success && Array.isArray(data.assessments)) {
        setAssessments(data.assessments);
      }
    } catch (err) {
      console.error('Error fetching student assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  useEffect(() => {
    if (preselectedAssessment) {
      setActiveAssessment(preselectedAssessment);
    }
  }, [preselectedAssessment]);

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssessment || !uploadFile) {
      setSubmitError('Please select a file to submit (.pdf, .docx, .pptx, .zip)');
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(null);
    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append('submission_file', uploadFile);

      const token = localStorage.getItem('assignment_token');
      const res = await fetch(`/api/student/assessments/${activeAssessment.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await safeJson(res);

      if (data.success) {
        setSubmitSuccess(data.message || 'Assessment submitted successfully.');
        setUploadFile(null);
        await fetchAssessments();
        // Update active assessment state
        setActiveAssessment((prev) => prev ? {
          ...prev,
          status: data.status,
          submitted_file_name: data.file_name,
          submitted_at: new Date().toISOString()
        } : null);
      } else {
        setSubmitError(data.message || 'Submission failed');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error occurred during submission');
    } finally {
      setUploadLoading(false);
    }
  };

  const filteredAssessments = assessments.filter((a) => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return !a.status || a.status === 'Pending';
    if (filter === 'Submitted') return a.status === 'Submitted' || a.status === 'Late';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assigned Assessments</h1>
          <p className="text-xs text-slate-500">
            View assignment instructions, download faculty materials, and submit your work
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'All' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({assessments.length})
          </button>
          <button
            onClick={() => setFilter('Pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'Pending' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('Submitted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'Submitted' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Submitted
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
          <button
            onClick={() => setSubmitSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* List of Assessments */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
            <span>Loading your assessments...</span>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No assessments found</p>
            <p className="text-xs text-slate-400 mt-1">You have no assessments matching the selected filter</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAssessments.map((a) => {
              const isSubmitted = a.status === 'Submitted';
              const isLate = a.status === 'Late';
              const isPending = !a.status || a.status === 'Pending';

              return (
                <div key={a.id} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-slate-900">{a.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                        {a.subject}
                      </span>
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
                    </div>

                    <p className="text-xs text-slate-600 max-w-2xl">{a.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                      <span>Faculty: <strong className="text-slate-700">{a.faculty_name}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Deadline: <strong className="text-slate-700">{a.deadline}</strong></span>
                      </span>
                      {a.attachment_path && (
                        <>
                          <span>•</span>
                          <a
                            href={`/api/files/${a.attachment_path}`}
                            download
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>Download Faculty Brief</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <button
                      onClick={() => {
                        setActiveAssessment(a);
                        setSubmitError(null);
                        setSubmitSuccess(null);
                        setUploadFile(null);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isPending
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{isPending ? 'Submit Assessment' : 'View / Resubmit'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SUBMISSION MODAL                                          */}
      {/* ========================================================= */}
      {activeAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Assessment Submission</span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">{activeAssessment.title}</h2>
              </div>
              <button
                onClick={() => {
                  setActiveAssessment(null);
                  if (onClearPreselected) onClearPreselected();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Assessment Details Summary */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Subject:</span>
                  <span className="font-bold text-slate-800">{activeAssessment.subject}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Faculty:</span>
                  <span className="font-bold text-slate-800">{activeAssessment.faculty_name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Deadline:</span>
                  <span className="font-bold text-slate-800 font-mono">{activeAssessment.deadline}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                  <p className="text-xs text-slate-600">{activeAssessment.description}</p>
                </div>
              </div>

              {activeAssessment.status && (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Current Status:</span>
                  <span className={`font-bold ${
                    activeAssessment.status === 'Submitted' ? 'text-emerald-700' :
                    activeAssessment.status === 'Late' ? 'text-amber-700' : 'text-slate-600'
                  }`}>
                    {activeAssessment.status}
                  </span>
                </div>
              )}

              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Upload Form */}
              <form onSubmit={handleSubmitSolution} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Upload Solution File (.PDF, .DOCX, .PPTX, .ZIP) *
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
                    <input
                      type="file"
                      id="submissionFile"
                      required
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadFile(e.target.files[0]);
                          setSubmitError(null);
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="submissionFile"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      {uploadFile ? (
                        <div>
                          <div className="text-xs font-bold text-slate-900">{uploadFile.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to submit
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-bold text-slate-700">Click to browse your document</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Allowed formats: PDF, Word, PowerPoint, ZIP
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAssessment(null);
                      if (onClearPreselected) onClearPreselected();
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadLoading || !uploadFile}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {uploadLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        <span>Submit Assessment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
