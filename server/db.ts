import initSqlJs, { type Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

let dbInstance: Database | null = null;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'assignment_system.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      initTables(dbInstance);
      seedInitialData(dbInstance);
      persistDb();
      return dbInstance;
    } catch (err) {
      console.warn('Could not read existing database file, creating fresh one:', err);
    }
  }

  dbInstance = new SQL.Database();
  initTables(dbInstance);
  seedInitialData(dbInstance);
  persistDb();
  return dbInstance;
}

export function persistDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to persist database to file:', err);
  }
}

function initTables(db: Database) {
  db.run(`PRAGMA foreign_keys = ON;`);

  // 1. Users Table (id, name, email, password_hash, role, department, year_class, created_at, updated_at)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'faculty')),
      department TEXT DEFAULT 'Computer Science & Engineering',
      year_class TEXT DEFAULT 'III Year CSE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Assessments Table (id, faculty_id, title, description, subject, deadline, attachment_path, created_at, updated_at)
  db.run(`
    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faculty_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      subject TEXT NOT NULL,
      deadline TEXT NOT NULL,
      attachment_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 3. Assessment Students Mapping Table (id, assessment_id, student_id, assigned_at)
  db.run(`
    CREATE TABLE IF NOT EXISTS assessment_students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(assessment_id, student_id),
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 4. Submissions Table (id, assessment_id, student_id, file_name, file_path, submitted_at, status)
  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL CHECK(status IN ('Pending', 'Submitted', 'Late')),
      UNIQUE(assessment_id, student_id),
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

function seedInitialData(db: Database) {
  // Check if users already exist
  const countRow = queryOne(db, 'SELECT COUNT(*) as count FROM users');
  if (countRow && countRow.count > 0) {
    return;
  }

  const facultyPasswordHash = bcrypt.hashSync('Faculty123', 10);

  // Seed default Faculty account so faculty can sign in immediately
  execute(db, `
    INSERT INTO users (name, email, password_hash, role, department, year_class)
    VALUES (?, ?, ?, 'faculty', 'Computer Science & Engineering', 'Faculty In-Charge');
  `, ['Faculty Member', 'faculty@college.edu', facultyPasswordHash]);

  // Note: No students are pre-seeded. Students register themselves or are added by Faculty.
  console.log('Database initialized with default Faculty account. Student list is clean (0 students).');
}

// Database helper functions
export function queryAll(db: Database, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function queryOne(db: Database, sql: string, params: any[] = []): any | null {
  const rows = queryAll(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function execute(db: Database, sql: string, params: any[] = []): { lastInsertRowId: number; rowsModified: number } {
  db.run(sql, params);
  const lastIdRes = queryOne(db, 'SELECT last_insert_rowid() as id');
  persistDb();
  return {
    lastInsertRowId: lastIdRes ? lastIdRes.id : 0,
    rowsModified: 1,
  };
}
