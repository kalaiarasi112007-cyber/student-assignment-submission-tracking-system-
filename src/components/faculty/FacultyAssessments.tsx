import React, { useState, useEffect } from 'react';
import { Assessment, User } from '../../types.ts';
import { apiFetch, safeJson } from '../../lib/api.ts';
import { 
  BookOpen, 
  PlusCircle, 
  Users, 
  Calendar, 
  FileText, 
  Paperclip, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X,
  UploadCloud,
  Check,
  Download
} from 'lucide-react';

interface FacultyAssessmentsProps {
  onSelectAssessmentForTracking?: (assessmentId: number) => void;
  onNavigateToSubmissions?: () => void;
}

export const FacultyAssessments: React.FC<FacultyAssessmentsProps> = ({
  onSelectAssessmentForTracking,
  onNavigateToSubmissions
}) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('DBMS');
  const [deadline, setDeadline] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // Feedback States
  const [createLoading, setCreateLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/faculty/assessments');
      const data = await safeJson(res);
      if (data.success) {
        setAssessments(data.assessments || []);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await apiFetch('/api/faculty/students');
      const data = await safeJson(res);
      if (data.success && Array.isArray(data.students)) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  useEffect(() => {
    fetchAssessments();
    fetchStudents();
  }, []);

  const handleToggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim() || !description.trim() || !subject.trim() || !deadline) {
      setErrorMessage('Please fill in Title, Description, Subject, and Deadline.');
      return;
    }

    if (selectedStudentIds.length === 0) {
      setErrorMessage('Please select at least one student to receive this assessment.');
      return;
    }

    setCreateLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('subject', subject.trim());
      formData.append('deadline', deadline);
      formData.append('student_ids', JSON.stringify(selectedStudentIds));
      if (attachmentFile) {
        formData.append('attachment', attachmentFile);
      }

      const token = localStorage.getItem('assignment_token');
      const res = await fetch('/api/faculty/assessments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await safeJson(res);

      if (data.success) {
        setSuccessMessage(`Assessment "${title}" created and pushed to ${selectedStudentIds.length} student(s)!`);
        setIsCreateOpen(false);
        // Reset form
        setTitle('');
        setDescription('');
        setSubject('DBMS');
        setDeadline('');
        setAttachmentFile(null);
        setSelectedStudentIds([]);
        await fetchAssessments();
      } else {
        setErrorMessage(data.message || 'Failed to create assessment.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while creating assessment.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assessments & Assignments</h1>
          <p className="text-xs text-slate-500">
            Create, push, and track assignments distributed to specific enrolled students
          </p>
        </div>

        <button
          onClick={() => {
            fetchStudents();
            setIsCreateOpen(true);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create & Push Assessment</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* List of Assessments */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">My Assessments ({assessments.length})</h2>
          <span className="text-xs text-slate-500">Stored in SQL Database</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
            <span>Loading assessments...</span>
          </div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No assessments created yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Click the button above to create your first assessment, choose which students receive it, and push it live.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assessments.map((a) => {
              const assigned = a.assigned_count || 0;
              const submitted = a.submitted_count || 0;
              const pending = Math.max(0, assigned - submitted);

              return (
                <div key={a.id} className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-slate-900">{a.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                        {a.subject}
                      </span>
                      {a.attachment_path && (
                        <a
                          href={`/api/files/${a.attachment_path}`}
                          download
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 font-medium"
                          title="Download attached assignment prompt"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>Attachment</span>
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 max-w-2xl">{a.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Deadline: <strong className="text-slate-700">{a.deadline}</strong></span>
                      </span>
                      <span>•</span>
                      <span>Assigned to: <strong className="text-slate-700">{assigned} student(s)</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {submitted} / {assigned} Submitted
                      </div>
                      <div className="text-[11px] text-amber-600 font-medium">
                        {pending} Pending
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (onSelectAssessmentForTracking) {
                          onSelectAssessmentForTracking(a.id);
                        }
                        if (onNavigateToSubmissions) {
                          onNavigateToSubmissions();
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      View Submissions
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* CREATE & PUSH ASSESSMENT MODAL                             */}
      {/* ========================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create & Push Assessment</h2>
                <p className="text-xs text-slate-500">Specify details and select which students receive this assessment</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAssessment} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assessment Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. DBMS Assignment 1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="DBMS"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description & Instructions *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Write SQL queries for the given questions and submit in PDF or ZIP format."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deadline (Date & Time) *
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Attachment (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAttachmentFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-student selection list */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Students to Receive Assessment * ({selectedStudentIds.length} Selected)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllStudents}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {students.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      <p className="font-semibold text-slate-700 mb-1">No students in your roster yet</p>
                      <p className="text-slate-400">Go to the "Student List" tab to add students or ask students to register.</p>
                    </div>
                  ) : (
                    students.map((student) => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      return (
                        <div
                          key={student.id}
                          onClick={() => handleToggleStudent(student.id)}
                          className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{student.name}</div>
                              <div className="text-[11px] font-mono text-slate-400">{student.email}</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {student.year_class || 'Student'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Only the students checked above will see this assessment in their student dashboard.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {createLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Push Assessment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
