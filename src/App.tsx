import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.tsx';
import { AuthPortal } from './components/auth/AuthPortal.tsx';
import { Navbar } from './components/Navbar.tsx';
import { ProfileView } from './components/common/ProfileView.tsx';

// Faculty components
import { FacultyDashboard } from './components/faculty/FacultyDashboard.tsx';
import { FacultyAssessments } from './components/faculty/FacultyAssessments.tsx';
import { FacultySubmissions } from './components/faculty/FacultySubmissions.tsx';
import { FacultyStudents } from './components/faculty/FacultyStudents.tsx';

// Student components
import { StudentDashboard } from './components/student/StudentDashboard.tsx';
import { StudentAssessments } from './components/student/StudentAssessments.tsx';
import { StudentSubmissions } from './components/student/StudentSubmissions.tsx';

import { Assessment } from './types.ts';
import { RefreshCw } from 'lucide-react';

export function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'assessments' | 'submissions' | 'students' | 'profile'>('dashboard');

  // Shared state for navigation transitions
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [selectedStudentAssessment, setSelectedStudentAssessment] = useState<Assessment | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-500">Loading student assignment tracking system...</p>
        </div>
      </div>
    );
  }

  // Not authenticated -> Show Unified Login / Register Portal
  if (!user) {
    return <AuthPortal />;
  }

  const isFaculty = user.role === 'faculty';

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
      {/* Main Navigation Bar with Role Tabs and Prominent Log Out */}
      <Navbar currentTab={currentTab} onNavigate={(tab: any) => setCurrentTab(tab)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isFaculty ? (
          /* ======================================================== */
          /* FACULTY ROLE VIEWS (STRICTLY FACULTY ONLY)               */
          /* ======================================================== */
          <>
            {currentTab === 'dashboard' && (
              <FacultyDashboard 
                onNavigate={(tab) => setCurrentTab(tab as any)}
                onSelectAssessmentForTracking={(id) => {
                  setSelectedAssessmentId(id);
                  setCurrentTab('submissions');
                }}
              />
            )}
            {currentTab === 'assessments' && (
              <FacultyAssessments 
                onSelectAssessmentForTracking={(id) => setSelectedAssessmentId(id)}
                onNavigateToSubmissions={() => setCurrentTab('submissions')}
              />
            )}
            {currentTab === 'submissions' && (
              <FacultySubmissions initialAssessmentId={selectedAssessmentId} />
            )}
            {currentTab === 'students' && (
              <FacultyStudents />
            )}
            {currentTab === 'profile' && <ProfileView />}
          </>
        ) : (
          /* ======================================================== */
          /* STUDENT ROLE VIEWS (STRICTLY STUDENT ONLY)               */
          /* ======================================================== */
          <>
            {currentTab === 'dashboard' && (
              <StudentDashboard 
                onNavigate={(tab) => setCurrentTab(tab as any)}
                onOpenSubmitModal={(assessment) => {
                  setSelectedStudentAssessment(assessment);
                  setCurrentTab('assessments');
                }}
              />
            )}
            {currentTab === 'assessments' && (
              <StudentAssessments 
                preselectedAssessment={selectedStudentAssessment}
                onClearPreselected={() => setSelectedStudentAssessment(null)}
              />
            )}
            {currentTab === 'submissions' && <StudentSubmissions />}
            {currentTab === 'profile' && <ProfileView />}
          </>
        )}
      </main>

      {/* Clean Academic Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>Student Assignment Submission & Tracking System &bull; Multi-Role Institutional Portal</p>
      </footer>
    </div>
  );
}

export default App;
