import React, { useState, useEffect } from 'react';
import { Database, Play, RefreshCw, X, Table, Code, CheckCircle, AlertTriangle } from 'lucide-react';
import { apiFetch, safeJson } from '../../lib/api.ts';

interface SqlInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TableInfo {
  name: string;
  row_count: number;
  sql: string;
  sample_rows: any[];
}

export const SqlInspectorModal: React.FC<SqlInspectorModalProps> = ({ isOpen, onClose }) => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('submissions');
  const [loading, setLoading] = useState(false);
  const [querySql, setQuerySql] = useState<string>(`-- Assignment-wise Student Submission Tracking JOIN Query
SELECT 
  s.roll_number,
  u.name as student_name,
  s.class,
  a.title as assignment_title,
  sub.status,
  sub.submission_date,
  sub.file_name,
  sub.marks
FROM enrollments e
JOIN students s ON e.student_id = s.student_id
JOIN users u ON s.user_id = u.user_id
JOIN assignments a ON a.subject_id = e.subject_id
LEFT JOIN submissions sub ON sub.assignment_id = a.assignment_id AND sub.student_id = s.student_id
WHERE a.assignment_id = 1
ORDER BY s.roll_number ASC;`);
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  const sampleQueries = [
    {
      label: 'Assignment #1 Student-wise Tracking (JOIN)',
      sql: `SELECT 
  s.roll_number,
  u.name as student_name,
  s.class,
  a.title as assignment_title,
  COALESCE(sub.status, 'Pending') as submission_status,
  COALESCE(sub.submission_date, '-') as submission_date,
  sub.marks
FROM enrollments e
JOIN students s ON e.student_id = s.student_id
JOIN users u ON s.user_id = u.user_id
JOIN assignments a ON a.subject_id = e.subject_id
LEFT JOIN submissions sub ON sub.assignment_id = a.assignment_id AND sub.student_id = s.student_id
WHERE a.assignment_id = 1
ORDER BY s.roll_number ASC;`
    },
    {
      label: 'Student History (Kalai Arasi across all Subjects)',
      sql: `SELECT 
  u.name as student_name,
  sub_j.subject_name,
  a.title as assignment_title,
  a.deadline,
  COALESCE(sub.status, 'Pending') as status,
  sub.submission_date,
  sub.marks
FROM enrollments e
JOIN students s ON e.student_id = s.student_id
JOIN users u ON s.user_id = u.user_id
JOIN subjects sub_j ON e.subject_id = sub_j.subject_id
JOIN assignments a ON a.subject_id = sub_j.subject_id
LEFT JOIN submissions sub ON a.assignment_id = sub.assignment_id AND sub.student_id = s.student_id
WHERE s.student_id = 1
ORDER BY a.deadline DESC;`
    },
    {
      label: 'Faculty Assignment Submission Stats Aggregation',
      sql: `SELECT 
  s.subject_name,
  a.title as assignment_title,
  COUNT(DISTINCT e.student_id) as total_enrolled,
  COUNT(DISTINCT sub.submission_id) as total_submitted,
  (COUNT(DISTINCT e.student_id) - COUNT(DISTINCT sub.submission_id)) as total_pending,
  ROUND(CAST(COUNT(DISTINCT sub.submission_id) as FLOAT) / COUNT(DISTINCT e.student_id) * 100, 1) as submission_rate_pct
FROM assignments a
JOIN subjects s ON a.subject_id = s.subject_id
JOIN enrollments e ON s.subject_id = e.subject_id
LEFT JOIN submissions sub ON a.assignment_id = sub.assignment_id AND sub.student_id = e.student_id
GROUP BY a.assignment_id
ORDER BY a.assignment_id ASC;`
    },
    {
      label: 'Inspect Users & Roles Table',
      sql: `SELECT user_id, name, email, role, created_at FROM users ORDER BY role DESC, user_id ASC;`
    }
  ];

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/db/inspector');
      const data = await safeJson(res);
      if (data.success) {
        setTables(data.tables);
        if (!selectedTable && data.tables.length > 0) {
          setSelectedTable(data.tables[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load SQL tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTables();
    }
  }, [isOpen]);

  const handleExecute = async () => {
    setExecuting(true);
    setQueryError(null);
    try {
      const res = await apiFetch('/api/db/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: querySql })
      });
      const data = await safeJson(res);
      if (data.success) {
        setQueryResults(data.rows);
      } else {
        setQueryError(data.message || 'SQL execution failed');
        setQueryResults(null);
      }
    } catch (err: any) {
      setQueryError(err.message || 'Failed to connect to backend SQL engine');
      setQueryResults(null);
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  const currentTableData = tables.find(t => t.name === selectedTable);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 text-slate-100 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">
                  Relational SQL Database Engine
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SQLite / ANSI SQL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live inspection of tables, foreign keys, and student submission tracking JOIN queries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTables}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh Schema & Rows"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split into Tabs / SQL runner */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          
          {/* Table Selector Pills */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-indigo-400" />
              Relational Tables ({tables.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {tables.map(tbl => (
                <button
                  key={tbl.name}
                  onClick={() => setSelectedTable(tbl.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all flex items-center gap-2 ${
                    selectedTable === tbl.name
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  <span>{tbl.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                    selectedTable === tbl.name ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {tbl.row_count} rows
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Table DDL Schema and Preview */}
          {currentTableData && (
            <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-300">
                  Schema DDL: {currentTableData.name}
                </span>
                <span className="text-[11px] text-slate-400">
                  Total Records: <strong className="text-white">{currentTableData.row_count}</strong>
                </span>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                {currentTableData.sql.trim()}
              </pre>

              {/* Sample Rows Table */}
              {currentTableData.sample_rows.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        {Object.keys(currentTableData.sample_rows[0]).map(col => (
                          <th key={col} className="py-2 px-3 whitespace-nowrap font-medium text-slate-300">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {currentTableData.sample_rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          {Object.values(row).map((val: any, cIdx) => (
                            <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap text-[11px] max-w-xs truncate">
                              {val === null || val === undefined ? (
                                <span className="text-slate-600 italic">NULL</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No records in this table yet.</p>
              )}
            </div>
          )}

          {/* Interactive SQL Query Playground */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white font-display">
                  Live SQL Query Runner (JOINs & Aggregations)
                </span>
              </div>
              
              {/* Query presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Presets:</span>
                {sampleQueries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuerySql(q.sql);
                      setQueryResults(null);
                      setQueryError(null);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700"
                  >
                    {q.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <textarea
                value={querySql}
                onChange={(e) => setQuerySql(e.target.value)}
                rows={5}
                className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-lg border border-slate-700 focus:outline-hidden focus:border-indigo-500"
                placeholder="Enter SQL SELECT query..."
              />
              <button
                onClick={handleExecute}
                disabled={executing}
                className="absolute right-3 bottom-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                {executing ? 'Executing...' : 'Run SQL'}
              </button>
            </div>

            {queryError && (
              <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{queryError}</span>
              </div>
            )}

            {queryResults && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Query executed successfully
                  </span>
                  <span>{queryResults.length} records returned</span>
                </div>
                {queryResults.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-60">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-300 sticky top-0 border-b border-slate-800">
                        <tr>
                          {Object.keys(queryResults[0]).map(col => (
                            <th key={col} className="py-2 px-3 font-medium whitespace-nowrap bg-slate-900">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        {queryResults.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/60">
                            {Object.values(row).map((val: any, cIdx) => (
                              <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap text-[11px]">
                                {val === null ? <span className="text-slate-600 italic">NULL</span> : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Zero rows returned.</p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Relational Schema: 7 Tables (Users, Students, Faculty, Subjects, Enrollments, Assignments, Submissions)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Close Console
          </button>
        </div>

      </div>
    </div>
  );
};
