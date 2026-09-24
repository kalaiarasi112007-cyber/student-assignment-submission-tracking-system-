import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import multer from 'multer';
import { getDb, queryAll, queryOne, execute, persistDb } from './server/db.ts';


const JWT_SECRET = process.env.JWT_SECRET || 'academic-jwt-secret-assignment-tracker-2026';

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

// Allowed file extensions: PDF, DOC, DOCX, PPT, PPTX, ZIP, TXT
const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.zip', '.txt'];
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} is not allowed. Supported formats: ${allowedExtensions.join(', ')}`));
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 1. CORS Configuration
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
  }));

  // Force JSON headers on all API responses
  app.use('/api', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Body parser middleware
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Initialize SQL Database
  const db = await getDb();

  // ----------------------------------------------------
  // AUTHENTICATION & ROLE MIDDLEWARE
  // ----------------------------------------------------
  function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.'
      });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Please login again'
        });
      }

      req.user = user;
      next();
    });
  }

  function requireFaculty(req: any, res: any, next: any) {
    if (!req.user || req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Faculty privileges required.'
      });
    }

    next();
  }

  function requireStudent(req: any, res: any, next: any) {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Student privileges required.'
      });
    }

    next();
  }

  // ----------------------------------------------------
  // 1. AUTH API ROUTES
  // ----------------------------------------------------

  // Registered Accounts Directory (for evaluation / test flow)
  app.get('/api/auth/demo-users', (_req, res) => {
    try {
      const users = queryAll(db, `
        SELECT id, name, email, role, department, year_class, created_at
        FROM users
        ORDER BY role DESC, id ASC;
      `);

      res.json({
        success: true,
        users
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  });

  // User Registration
  app.post('/api/auth/register', (req, res) => {
    try {
      const {
        name,
        email,
        password,
        confirmPassword,
        role,
        department,
        year_class
      } = req.body;

      // 1. Validate required fields
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, password, and role are required'
        });
      }

      // 2. Validate role
      const cleanRole = role.toLowerCase().trim();

      if (cleanRole !== 'student' && cleanRole !== 'faculty') {
        return res.status(400).json({
          success: false,
          message: 'Role must be either student or faculty'
        });
      }

      // 3. Confirm password check if provided
      if (confirmPassword && password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match'
        });
      }

      // 4. Validate email format
      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // 5. Check if email already registered
      const existing = queryOne(
        db,
        `SELECT id FROM users WHERE LOWER(email) = ?`,
        [cleanEmail]
      );

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // 6. Secure password hashing with bcrypt
      const passwordHash = bcrypt.hashSync(password, 10);

      const dept =
        department ||
        (cleanRole === 'faculty'
          ? 'Computer Science & Engineering'
          : 'Computer Science & Engineering');

      const yrClass =
        year_class ||
        (cleanRole === 'faculty'
          ? 'Assistant Professor'
          : 'III Year CSE');

      const result = execute(
        db,
        `
        INSERT INTO users (name, email, password_hash, role, department, year_class)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          name.trim(),
          cleanEmail,
          passwordHash,
          cleanRole,
          dept,
          yrClass
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful! You may now log in.',
        userId: result.lastInsertRowId
      });
    } catch (err: any) {
      console.error('Registration error:', err);

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  // Login with Email + Password
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      const user = queryOne(
        db,
        `
        SELECT id, name, email, password_hash, role, department, year_class, created_at
        FROM users
        WHERE LOWER(email) = ?;
        `,
        [cleanEmail]
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      // Bcrypt verification
      let passwordMatch = false;

      try {
        passwordMatch =
          bcrypt.compareSync(password, user.password_hash) ||
          bcrypt.compareSync(password.trim(), user.password_hash);
      } catch (e) {
        console.error('Bcrypt error:', e);
        passwordMatch = false;
      }

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT Token
      const token = jwt.sign(
        {
          id: user.id,
          userId: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { password_hash: _, ...safeUser } = user;

      res.json({
        success: true,
        message: 'Login successful',
        user: safeUser,
        token
      });
    } catch (err: any) {
      console.error('Login error:', err);

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  // Change Password
  app.post(
    '/api/auth/change-password',
    authenticateToken,
    (req: any, res: any) => {
      try {
        const {
          currentPassword,
          newPassword,
          confirmPassword
        } = req.body;

        if (!currentPassword || !newPassword) {
          return res.status(400).json({
            success: false,
            message: 'Current password and new password are required'
          });
        }

        if (
          confirmPassword &&
          newPassword !== confirmPassword
        ) {
          return res.status(400).json({
            success: false,
            message: 'New passwords do not match'
          });
        }

        if (newPassword.length < 4) {
          return res.status(400).json({
            success: false,
            message: 'Password must be at least 4 characters long'
          });
        }

        const user = queryOne(
          db,
          `SELECT id, password_hash FROM users WHERE id = ?`,
          [req.user.id]
        );

        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        const match =
          bcrypt.compareSync(
            currentPassword,
            user.password_hash
          ) ||
          bcrypt.compareSync(
            currentPassword.trim(),
            user.password_hash
          );

        if (!match) {
          return res.status(401).json({
            success: false,
            message: 'Incorrect current password'
          });
        }

        const newHash = bcrypt.hashSync(newPassword, 10);

        execute(
          db,
          `
          UPDATE users
          SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          `,
          [newHash, req.user.id]
        );

        res.json({
          success: true,
          message: 'Password updated successfully'
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // ----------------------------------------------------
  // 2. PROFILE API ROUTES
  // ----------------------------------------------------

  // Get current user's profile
  app.get(
    '/api/profile',
    authenticateToken,
    (req: any, res: any) => {
      try {
        const user = queryOne(
          db,
          `
          SELECT id, name, email, role, department, year_class, created_at, updated_at
          FROM users
          WHERE id = ?;
          `,
          [req.user.id]
        );

        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'Profile not found'
          });
        }

        res.json({
          success: true,
          profile: user
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // Edit profile
  app.put(
    '/api/profile',
    authenticateToken,
    (req: any, res: any) => {
      try {
        const {
          name,
          department,
          year_class
        } = req.body;

        if (!name || !name.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Name cannot be empty'
          });
        }

        execute(
          db,
          `
          UPDATE users
          SET name = ?, department = ?, year_class = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?;
          `,
          [
            name.trim(),
            department || '',
            year_class || '',
            req.user.id
          ]
        );

        const updatedUser = queryOne(
          db,
          `
          SELECT id, name, email, role, department, year_class, created_at, updated_at
          FROM users
          WHERE id = ?;
          `,
          [req.user.id]
        );

        res.json({
          success: true,
          message: 'Profile updated successfully',
          profile: updatedUser
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // ----------------------------------------------------
  // 3. FACULTY API ROUTES
  // ----------------------------------------------------

  // Faculty Dashboard Summary
  app.get(
    '/api/faculty/dashboard',
    authenticateToken,
    requireFaculty,
    (req: any, res: any) => {
      try {
        const facultyId = req.user.id;

        const assessmentsCountRes = queryOne(
          db,
          `
          SELECT COUNT(*) as count
          FROM assessments
          WHERE faculty_id = ?
          `,
          [facultyId]
        );

        const totalAssessments =
          assessmentsCountRes
            ? assessmentsCountRes.count
            : 0;

        const studentsCountRes = queryOne(
          db,
          `
          SELECT COUNT(DISTINCT ast.student_id) as count
          FROM assessment_students ast
          JOIN assessments a
            ON ast.assessment_id = a.id
          WHERE a.faculty_id = ?;
          `,
          [facultyId]
        );

        const totalStudents =
          studentsCountRes
            ? studentsCountRes.count
            : 0;

        const submissionsCountRes = queryOne(
          db,
          `
          SELECT COUNT(*) as count
          FROM submissions s
          JOIN assessments a
            ON s.assessment_id = a.id
          WHERE a.faculty_id = ?;
          `,
          [facultyId]
        );

        const totalSubmissions =
          submissionsCountRes
            ? submissionsCountRes.count
            : 0;

        const expectedCountRes = queryOne(
          db,
          `
          SELECT COUNT(*) as count
          FROM assessment_students ast
          JOIN assessments a
            ON ast.assessment_id = a.id
          WHERE a.faculty_id = ?;
          `,
          [facultyId]
        );

        const totalAssignedInstances =
          expectedCountRes
            ? expectedCountRes.count
            : 0;

        const pendingSubmissions = Math.max(
          0,
          totalAssignedInstances - totalSubmissions
        );

        const recentAssessments = queryAll(
          db,
          `
          SELECT
            a.id,
            a.title,
            a.subject,
            a.deadline,
            a.created_at,
            (
              SELECT COUNT(*)
              FROM assessment_students ast
              WHERE ast.assessment_id = a.id
            ) as assigned_count,
            (
              SELECT COUNT(*)
              FROM submissions s
              WHERE s.assessment_id = a.id
            ) as submitted_count
          FROM assessments a
          WHERE a.faculty_id = ?
          ORDER BY a.id DESC
          LIMIT 5;
          `,
          [facultyId]
        );

        res.json({
          success: true,
          summary: {
            totalAssessments,
            totalStudents,
            totalSubmissions,
            pendingSubmissions
          },
          recentAssessments
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // Get all registered students
  app.get(
    '/api/faculty/students',
    authenticateToken,
    requireFaculty,
    (_req: any, res: any) => {
      try {
        const students = queryAll(
          db,
          `
          SELECT
            id,
            name,
            email,
            department,
            year_class,
            created_at,
            (
              SELECT COUNT(*)
              FROM assessment_students ast
              WHERE ast.student_id = users.id
            ) as assigned_count,
            (
              SELECT COUNT(*)
              FROM submissions s
              WHERE s.student_id = users.id
            ) as submitted_count
          FROM users
          WHERE role = 'student'
          ORDER BY name ASC;
          `
        );

        res.json({
          success: true,
          students
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // Faculty can manually add a student
  app.post(
    '/api/faculty/students',
    authenticateToken,
    requireFaculty,
    (req: any, res: any) => {
      try {
        const {
          name,
          email,
          department,
          year_class,
          password
        } = req.body;

        if (
          !name ||
          !name.trim() ||
          !email ||
          !email.trim()
        ) {
          return res.status(400).json({
            success: false,
            message: 'Student Name and Email are required'
          });
        }

        const cleanEmail =
          email.trim().toLowerCase();

        const existing = queryOne(
          db,
          'SELECT id FROM users WHERE LOWER(email) = ?',
          [cleanEmail]
        );

        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'A user with this email already exists'
          });
        }

        const rawPassword =
          password && password.trim()
            ? password.trim()
            : 'Student123';

        const hash =
          bcrypt.hashSync(rawPassword, 10);

        const result = execute(
          db,
          `
          INSERT INTO users
          (name, email, password_hash, role, department, year_class)
          VALUES (?, ?, ?, 'student', ?, ?);
          `,
          [
            name.trim(),
            cleanEmail,
            hash,
            department?.trim() ||
              'Computer Science & Engineering',
            year_class?.trim() ||
              'III Year CSE'
          ]
        );

        res.status(201).json({
          success: true,
          message: `Student "${name.trim()}" added to roster with password: ${rawPassword}`,
          student: {
            id: result.lastInsertRowId,
            name: name.trim(),
            email: cleanEmail,
            department:
              department?.trim() ||
              'Computer Science & Engineering',
            year_class:
              year_class?.trim() ||
              'III Year CSE'
          }
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // Faculty can remove a student
  app.delete(
    '/api/faculty/students/:id',
    authenticateToken,
    requireFaculty,
    (req: any, res: any) => {
      try {
        const studentId =
          parseInt(req.params.id, 10);

        execute(
          db,
          'DELETE FROM users WHERE id = ? AND role = "student"',
          [studentId]
        );

        res.json({
          success: true,
          message: 'Student removed from class roster'
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // Create & Push Assessment
  app.post(
    '/api/faculty/assessments',
    authenticateToken,
    requireFaculty,
    upload.single('attachment'),
    (req: any, res: any) => {
      try {
        const facultyId = req.user.id;

        const {
          title,
          description,
          subject,
          deadline,
          student_ids
        } = req.body;

        if (
          !title ||
          !description ||
          !subject ||
          !deadline
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Title, description, subject, and deadline are required'
          });
        }

        let parsedStudentIds: number[] = [];

        if (typeof student_ids === 'string') {
          try {
            parsedStudentIds =
              JSON.parse(student_ids);
          } catch {
            parsedStudentIds =
              student_ids
                .split(',')
                .map((id: string) =>
                  parseInt(id.trim(), 10)
                )
                .filter(Boolean);
          }
        } else if (Array.isArray(student_ids)) {
          parsedStudentIds =
            student_ids
              .map((id: any) =>
                parseInt(id, 10)
              )
              .filter(Boolean);
        }

        if (
          !parsedStudentIds ||
          parsedStudentIds.length === 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Please select at least one student to receive this assessment'
          });
        }

        const attachmentPath =
          req.file
            ? req.file.filename
            : null;

        const assessmentResult = execute(
          db,
          `
          INSERT INTO assessments
          (faculty_id, title, description, subject, deadline, attachment_path)
          VALUES (?, ?, ?, ?, ?, ?);
          `,
          [
            facultyId,
            title.trim(),
            description.trim(),
            subject.trim(),
            deadline,
            attachmentPath
          ]
        );

        const assessmentId =
          assessmentResult.lastInsertRowId;

        for (const studentId of parsedStudentIds) {
          execute(
            db,
            `
            INSERT OR IGNORE INTO assessment_students
            (assessment_id, student_id)
            VALUES (?, ?);
            `,
            [assessmentId, studentId]
          );
        }

        res.status(201).json({
          success: true,
          message:
            'Assessment created and pushed successfully to selected students',
          assessment_id: assessmentId,
          assigned_count:
            parsedStudentIds.length
        });
      } catch (err: any) {
        console.error(
          'Assessment creation error:',
          err
        );

        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // Get all assessments created by faculty
  app.get(
    '/api/faculty/assessments',
    authenticateToken,
    requireFaculty,
    (req: any, res: any) => {
      try {
        const facultyId = req.user.id;

        const assessments = queryAll(
          db,
          `
          SELECT
            a.id,
            a.faculty_id,
            a.title,
            a.description,
            a.subject,
            a.deadline,
            a.attachment_path,
            a.created_at,
            (
              SELECT COUNT(*)
              FROM assessment_students ast
              WHERE ast.assessment_id = a.id
            ) as assigned_count,
            (
              SELECT COUNT(*)
              FROM submissions s
              WHERE s.assessment_id = a.id
            ) as submitted_count
          FROM assessments a
          WHERE a.faculty_id = ?
          ORDER BY a.id DESC;
          `,
          [facultyId]
        );

        res.json({
          success: true,
          assessments
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // Get single assessment details
  app.get(
    '/api/faculty/assessments/:id',
    authenticateToken,
    requireFaculty,
    (req: any, res: any) => {
      try {
        const assessmentId =
          parseInt(req.params.id, 10);

        const facultyId = req.user.id;

        const assessment = queryOne(
          db,
          `
          SELECT *
          FROM assessments
          WHERE id = ? AND faculty_id = ?;
          `,
          [assessmentId, facultyId]
        );

        if (!assessment) {
          return res.status(404).json({
            success: false,
            message:
              'Assessment not found or access denied'
          });
        }

        res.json({
          success: true,
          assessment
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // Get submissions for a specific assessment
  app.get(
    '/api/faculty/assessments/:id/submissions',
    authenticateToken,
    requireFaculty,
    (req: any, res: any) => {
      try {
        const assessmentId =
          parseInt(req.params.id, 10);

        const facultyId = req.user.id;

        const assessment = queryOne(
          db,
          `
          SELECT *
          FROM assessments
          WHERE id = ? AND faculty_id = ?;
          `,
          [assessmentId, facultyId]
        );

        if (!assessment) {
          return res.status(403).json({
            success: false,
            message:
              'Access denied: You can only view submissions for your own assessments'
          });
        }

        const submissions = queryAll(
          db,
          `
          SELECT
            u.id as student_id,
            u.name as student_name,
            u.email as student_email,
            u.department as student_department,
            u.year_class as student_class,
            ast.assigned_at,
            s.id as submission_id,
            s.file_name,
            s.file_path,
            s.submitted_at,
            COALESCE(s.status, 'Pending') as status
          FROM assessment_students ast
          JOIN users u
            ON ast.student_id = u.id
          LEFT JOIN submissions s
            ON (
              ast.assessment_id = s.assessment_id
              AND ast.student_id = s.student_id
            )
          WHERE ast.assessment_id = ?
          ORDER BY s.submitted_at DESC, u.name ASC;
          `,
          [assessmentId]
        );

        res.json({
          success: true,
          assessment,
          submissions
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // Get all submissions across faculty assessments
  app.get(
    '/api/faculty/submissions',
    authenticateToken,
    requireFaculty,
    (req: any, res: any) => {
      try {
        const facultyId = req.user.id;

        const submissions = queryAll(
          db,
          `
          SELECT
            s.id as submission_id,
            s.assessment_id,
            s.student_id,
            s.file_name,
            s.file_path,
            s.submitted_at,
            s.status,
            a.title as assessment_title,
            a.subject as assessment_subject,
            a.deadline,
            u.name as student_name,
            u.email as student_email
          FROM submissions s
          JOIN assessments a
            ON s.assessment_id = a.id
          JOIN users u
            ON s.student_id = u.id
          WHERE a.faculty_id = ?
          ORDER BY s.submitted_at DESC;
          `,
          [facultyId]
        );

        res.json({
          success: true,
          submissions
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // ----------------------------------------------------
  // 4. STUDENT API ROUTES
  // ----------------------------------------------------

  // Student Dashboard Summary
  app.get(
    '/api/student/dashboard',
    authenticateToken,
    requireStudent,
    (req: any, res: any) => {
      try {
        const studentId = req.user.id;

        const totalCountRes = queryOne(
          db,
          `
          SELECT COUNT(*) as count
          FROM assessment_students
          WHERE student_id = ?;
          `,
          [studentId]
        );

        const totalAssessments =
          totalCountRes
            ? totalCountRes.count
            : 0;

        const submittedCountRes =
          queryOne(
            db,
            `
            SELECT COUNT(*) as count
            FROM submissions
            WHERE student_id = ?
            AND status = 'Submitted';
            `,
            [studentId]
          );

        const submittedCount =
          submittedCountRes
            ? submittedCountRes.count
            : 0;

        const lateCountRes = queryOne(
          db,
          `
          SELECT COUNT(*) as count
          FROM submissions
          WHERE student_id = ?
          AND status = 'Late';
          `,
          [studentId]
        );

        const lateCount =
          lateCountRes
            ? lateCountRes.count
            : 0;

        const pendingCount = Math.max(
          0,
          totalAssessments -
            (submittedCount + lateCount)
        );

        const assessments = queryAll(
          db,
          `
          SELECT
            a.id,
            a.title,
            a.subject,
            a.deadline,
            f.name as faculty_name,
            COALESCE(s.status, 'Pending') as status,
            s.submitted_at
          FROM assessment_students ast
          JOIN assessments a
            ON ast.assessment_id = a.id
          JOIN users f
            ON a.faculty_id = f.id
          LEFT JOIN submissions s
            ON (
              ast.assessment_id = s.assessment_id
              AND s.student_id = ?
            )
          WHERE ast.student_id = ?
          ORDER BY a.deadline ASC
          LIMIT 6;
          `,
          [studentId, studentId]
        );

        res.json({
          success: true,
          summary: {
            totalAssessments,
            pending: pendingCount,
            submitted: submittedCount,
            late: lateCount
          },
          assessments
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // Get all assessments assigned to student
  app.get(
    '/api/student/assessments',
    authenticateToken,
    requireStudent,
    (req: any, res: any) => {
      try {
        const studentId = req.user.id;

        const assessments = queryAll(
          db,
          `
          SELECT
            a.id,
            a.title,
            a.description,
            a.subject,
            a.deadline,
            a.attachment_path,
            a.created_at,
            f.name as faculty_name,
            f.email as faculty_email,
            COALESCE(s.status, 'Pending') as status,
            s.id as submission_id,
            s.file_name as submitted_file_name,
            s.file_path as submitted_file_path,
            s.submitted_at
          FROM assessment_students ast
          JOIN assessments a
            ON ast.assessment_id = a.id
          JOIN users f
            ON a.faculty_id = f.id
          LEFT JOIN submissions s
            ON (
              ast.assessment_id = s.assessment_id
              AND s.student_id = ?
            )
          WHERE ast.student_id = ?
          ORDER BY a.id DESC;
          `,
          [studentId, studentId]
        );

        res.json({
          success: true,
          assessments
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // Get specific assessment details for student
  app.get(
    '/api/student/assessments/:id',
    authenticateToken,
    requireStudent,
    (req: any, res: any) => {
      try {
        const assessmentId =
          parseInt(req.params.id, 10);

        const studentId = req.user.id;

        const assigned = queryOne(
          db,
          `
          SELECT *
          FROM assessment_students
          WHERE assessment_id = ?
          AND student_id = ?;
          `,
          [assessmentId, studentId]
        );

        if (!assigned) {
          return res.status(403).json({
            success: false,
            message:
              'Access denied: You are not assigned to this assessment'
          });
        }

        const assessment = queryOne(
          db,
          `
          SELECT
            a.id,
            a.title,
            a.description,
            a.subject,
            a.deadline,
            a.attachment_path,
            a.created_at,
            f.name as faculty_name,
            f.email as faculty_email,
            COALESCE(s.status, 'Pending') as status,
            s.id as submission_id,
            s.file_name as submitted_file_name,
            s.file_path as submitted_file_path,
            s.submitted_at
          FROM assessments a
          JOIN users f
            ON a.faculty_id = f.id
          LEFT JOIN submissions s
            ON (
              a.id = s.assessment_id
              AND s.student_id = ?
            )
          WHERE a.id = ?;
          `,
          [studentId, assessmentId]
        );

        res.json({
          success: true,
          assessment
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // Submit assessment
  app.post(
    '/api/student/assessments/:id/submit',
    authenticateToken,
    requireStudent,
    upload.single('submission_file'),
    (req: any, res: any) => {
      try {
        const assessmentId =
          parseInt(req.params.id, 10);

        const studentId = req.user.id;

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message:
              'Please upload a submission file (.pdf, .doc, .docx, .ppt, .pptx, .zip)'
          });
        }

        const assignment = queryOne(
          db,
          `
          SELECT a.id, a.deadline
          FROM assessment_students ast
          JOIN assessments a
            ON ast.assessment_id = a.id
          WHERE ast.assessment_id = ?
          AND ast.student_id = ?;
          `,
          [assessmentId, studentId]
        );

        if (!assignment) {
          return res.status(403).json({
            success: false,
            message:
              'Access denied: You are not assigned to this assessment'
          });
        }

        const now = new Date();
        const deadlineDate =
          new Date(assignment.deadline);

        const status =
          now > deadlineDate
            ? 'Late'
            : 'Submitted';

        const fileName =
          req.file.originalname;

        const filePath =
          req.file.filename;

        execute(
          db,
          `
          INSERT OR REPLACE INTO submissions
          (assessment_id, student_id, file_name, file_path, submitted_at, status)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?);
          `,
          [
            assessmentId,
            studentId,
            fileName,
            filePath,
            status
          ]
        );

        res.json({
          success: true,
          message:
            'Assessment submitted successfully.',
          status,
          file_name: fileName
        });
      } catch (err: any) {
        console.error(
          'Submission error:',
          err
        );

        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // Get all submissions made by student
  app.get(
    '/api/student/submissions',
    authenticateToken,
    requireStudent,
    (req: any, res: any) => {
      try {
        const studentId = req.user.id;

        const submissions = queryAll(
          db,
          `
          SELECT
            s.id,
            s.assessment_id,
            s.file_name,
            s.file_path,
            s.submitted_at,
            s.status,
            a.title as assessment_title,
            a.subject,
            a.deadline,
            f.name as faculty_name
          FROM submissions s
          JOIN assessments a
            ON s.assessment_id = a.id
          JOIN users f
            ON a.faculty_id = f.id
          WHERE s.student_id = ?
          ORDER BY s.submitted_at DESC;
          `,
          [studentId]
        );

        res.json({
          success: true,
          submissions
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // ----------------------------------------------------
  // 5. FILE DOWNLOAD / SERVING API
  // ----------------------------------------------------

  app.get(
    '/api/files/:filename',
    authenticateToken,
    (req: any, res: any) => {
      try {
        const filename =
          path.basename(req.params.filename);

        const filePath =
          path.join(
            UPLOADS_DIR,
            filename
          );

        if (!fs.existsSync(filePath)) {
          return res.status(404).json({
            success: false,
            message: 'File not found'
          });
        }

        res.download(filePath);
      } catch (err: any) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  // ----------------------------------------------------
  // API 404 & ERROR HANDLING
  // ----------------------------------------------------

  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message:
        `API endpoint not found: ${req.method} ${req.originalUrl}`
    });
  });

  app.use(
    '/api',
    (err: any, _req: any, res: any, _next: any) => {
      console.error('API Error:', err);

      res.status(err.status || 500).json({
        success: false,
        message:
          err.message ||
          'Internal server error occurred in API'
      });
    }
  );

  // ----------------------------------------------------
  // VITE & STATIC SERVING
  // ----------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true
      },
      appType: 'custom',
    });

    app.use(vite.middlewares);

    app.use(
      '*',
      async (req, res, next) => {
        const url = req.originalUrl;

        if (url.startsWith('/api')) {
          return next();
        }

        try {
          let template =
            fs.readFileSync(
              path.resolve(
                process.cwd(),
                'index.html'
              ),
              'utf-8'
            );

          template =
            await vite.transformIndexHtml(
              url,
              template
            );

          res
            .status(200)
            .set({
              'Content-Type': 'text/html'
            })
            .end(template);
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          next(e);
        }
      }
    );
  } else {
    const distPath =
      path.join(
        process.cwd(),
        'dist'
      );

    app.use(
      express.static(distPath)
    );

    app.get(
      '*',
      (_req, res) => {
        res.sendFile(
          path.join(
            distPath,
            'index.html'
          )
        );
      }
    );
  }

  app.listen(
    PORT,
    '0.0.0.0',
    () => {
      console.log(
        `Student Assignment Submission System running on port ${PORT}`
      );
    }
  );
}

startServer();