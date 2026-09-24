
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

  // Create data directory if it does not exist
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // Load existing database if available
  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);

      dbInstance = new SQL.Database(fileBuffer);

      initTables(dbInstance);

      // Make sure default faculty account exists
      seedInitialData(dbInstance);

      // Save any changes
      persistDb();

      return dbInstance;
    } catch (err) {
      console.warn(
        'Could not read existing database file, creating fresh one:',
        err
      );
    }
  }

  // Create a new database
  dbInstance = new SQL.Database();

  initTables(dbInstance);

  // Create default faculty account
  seedInitialData(dbInstance);

  // Save database
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

    console.log('Database saved successfully.');
  } catch (err) {
    console.error('Failed to persist database to file:', err);
  }
}

function initTables(db: Database) {
  db.run(`PRAGMA foreign_keys = ON;`);

  // =========================================================
  // 1. USERS TABLE
  // =========================================================

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

  // =========================================================
  // 2. ASSESSMENTS TABLE
  // =========================================================

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
      FOREIGN KEY (faculty_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );
  `);

  // =========================================================
  // 3. ASSESSMENT STUDENTS MAPPING TABLE
  // =========================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS assessment_students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(assessment_id, student_id),
      FOREIGN KEY (assessment_id)
        REFERENCES assessments(id)
        ON DELETE CASCADE,
      FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );
  `);

  // =========================================================
  // 4. SUBMISSIONS TABLE
  // =========================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL
        CHECK(status IN ('Pending', 'Submitted', 'Late')),
      UNIQUE(assessment_id, student_id),
      FOREIGN KEY (assessment_id)
        REFERENCES assessments(id)
        ON DELETE CASCADE,
      FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );
  `);
}

// =========================================================
// DEFAULT FACULTY ACCOUNT
// =========================================================

function seedInitialData(db: Database) {
  // Check specifically for the default faculty account.
  // We should NOT check whether users table is empty because
  // students may already exist.

  const faculty = queryOne(
    db,
    `
    SELECT id
    FROM users
    WHERE LOWER(email) = ?
    `,
    ['faculty@college.edu']
  );

  // If default faculty does not exist, create it.
  if (!faculty) {
    const facultyPasswordHash = bcrypt.hashSync(
      'Faculty123',
      10
    );

    execute(
      db,
      `
      INSERT INTO users
      (
        name,
        email,
        password_hash,
        role,
        department,
        year_class
      )
      VALUES (?, ?, ?, 'faculty', ?, ?);
      `,
      [
        'Faculty Member',
        'faculty@college.edu',
        facultyPasswordHash,
        'Computer Science & Engineering',
        'Faculty In-Charge'
      ]
    );

    console.log('Default Faculty account created.');
  } else {
    console.log('Default Faculty account already exists.');
  }
}

// =========================================================
// DATABASE HELPER FUNCTIONS
// =========================================================

export function queryAll(
  db: Database,
  sql: string,
  params: any[] = []
): any[] {
  const stmt = db.prepare(sql);

  stmt.bind(params);

  const rows: any[] = [];

  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }

  stmt.free();

  return rows;
}

export function queryOne(
  db: Database,
  sql: string,
  params: any[] = []
): any | null {
  const rows = queryAll(db, sql, params);

  return rows.length > 0 ? rows[0] : null;
}

// =========================================================
// EXECUTE DATABASE QUERY
// =========================================================

export function execute(
  db: Database,
  sql: string,
  params: any[] = []
): {
  lastInsertRowId: number;
  rowsModified: number;
} {
  db.run(sql, params);

  const lastIdRes = queryOne(
    db,
    'SELECT last_insert_rowid() as id'
  );

  // Save database after every INSERT / UPDATE / DELETE
  persistDb();

  return {
    lastInsertRowId: lastIdRes
      ? Number(lastIdRes.id)
      : 0,
    rowsModified: 1,
  };
}


