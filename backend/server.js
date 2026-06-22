const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const db = require('./config/db');
const { resetDatabase } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    if (filetypes.test(path.extname(file.originalname).toLowerCase()) && filetypes.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

let transporter;
async function setupTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('Using configured SMTP credentials.');
  } else {
    try {
      let testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('Using Ethereal fallback for email testing.');
    } catch (e) {
      console.error('Failed to create Ethereal test account', e);
    }
  }
}
setupTransporter();

// In-memory OTP store: email -> { otp, expiresAt }
const otpStore = new Map();

// --- API ROUTES ---

app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await db.query('SELECT id, name, email, role FROM users ORDER BY name ASC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve active user personas' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username/Email and Password are required.' });

  try {
    const userRows = await db.query('SELECT * FROM users WHERE (email = ? OR name = ?) AND password = ?', [username, username, password]);
    if (userRows.length === 0) return res.status(401).json({ error: 'Invalid username or password.' });

    const user = userRows[0];
    res.json({ id: user.id || user.ID, name: user.name || user.NAME, email: user.email || user.EMAIL, role: user.role || user.ROLE });
  } catch (err) {
    res.status(500).json({ error: 'Internal login error.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, childId } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required.' });

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already exists.' });

    await db.query('INSERT INTO users (name, email, role, password) VALUES (?, ?, ?, ?)', [name, email, 'parent', password]);
    const created = await db.query('SELECT id, name, email, role FROM users WHERE email = ?', [email]);
    const parentId = created[0].id || created[0].ID;

    if (childId) {
      await db.query('UPDATE children SET parent_id = ?, parent_username = ? WHERE id = ?', [parentId, email, parseInt(childId)]);
    }
    await db.query('UPDATE children SET parent_id = ? WHERE LOWER(parent_username) = ?', [parentId, email.toLowerCase()]);
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(500).json({ error: 'Registration error occurred.' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const userRows = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (userRows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    if (transporter) {
      let info = await transporter.sendMail({
        from: '"Daily Activity Portal" <noreply@dailyactivity.com>',
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
        html: `<b>Your OTP for password reset is: ${otp}</b><br/>It is valid for 10 minutes.`
      });
      console.log("OTP email sent to %s. MessageId: %s", email, info.messageId);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("Ethereal Preview URL: %s", previewUrl);
      }
    } else {
       console.log('OTP generated (no email config):', otp);
    }

    res.json({ success: true, message: 'OTP sent to email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process forgot password request.' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

  const record = otpStore.get(email.toLowerCase());
  if (!record) return res.status(400).json({ error: 'No OTP requested for this email or it has expired.' });

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({ error: 'OTP has expired.' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP.' });
  }

  res.json({ success: true, message: 'OTP verified.' });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'All fields are required.' });

  const record = otpStore.get(email.toLowerCase());
  if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }

  try {
    await db.query('UPDATE users SET password = ? WHERE email = ?', [newPassword, email]);
    otpStore.delete(email.toLowerCase());
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

app.get('/api/users', async (req, res) => {
  try { res.json(await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY id DESC')); }
  catch (err) { res.status(500).json({ error: 'Failed to retrieve users list' }); }
});

app.post('/api/users', async (req, res) => {
  const { name, email, role, password } = req.body;
  try {
    const existing = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'User exists.' });

    await db.query('INSERT INTO users (name, email, role, password) VALUES (?, ?, ?, ?)', [name, email, role, password]);
    const created = await db.query('SELECT id, name, email, role FROM users WHERE email = ?', [email]);
    res.status(201).json(created[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to create user' }); }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.query('SELECT role FROM users WHERE id = ?', [parseInt(id)]);
    if (user.length > 0 && user[0].role === 'admin') return res.status(400).json({ error: 'Cannot delete admin.' });

    await db.query('DELETE FROM children WHERE parent_id = ?', [parseInt(id)]);
    await db.query('DELETE FROM activities WHERE teacher_id = ?', [parseInt(id)]);
    await db.query('DELETE FROM counsellor_notes WHERE counsellor_id = ?', [parseInt(id)]);
    await db.query('DELETE FROM users WHERE id = ?', [parseInt(id)]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete user account.' }); }
});

app.get('/api/children', async (req, res) => {
  const { parentId } = req.query;
  try {
    let sql = `SELECT c.id, c.name, c.age, c.class_name, c.parent_id, c.parent_username, c.water_intake, c.rest, c.focus, u.name as parent_name FROM children c LEFT JOIN users u ON c.parent_id = u.id`;
    let params = [];
    if (parentId) { sql += ' WHERE c.parent_id = ?'; params.push(parentId); }
    sql += ' ORDER BY c.id DESC';
    res.json(await db.query(sql, params));
  } catch (err) { res.status(500).json({ error: 'Failed to retrieve children' }); }
});

app.get('/api/children/unassigned', async (req, res) => {
  try { res.json(await db.query('SELECT id, name, class_name FROM children WHERE parent_id IS NULL ORDER BY name ASC')); }
  catch (err) { res.status(500).json({ error: 'Failed to retrieve unassigned children' }); }
});

app.post('/api/children', async (req, res) => {
  const { name, age, class_name, parent_username } = req.body;
  try {
    const parentRows = await db.query('SELECT id FROM users WHERE LOWER(email) = ?', [parent_username.toLowerCase()]);
    let parent_id = parentRows.length > 0 ? (parentRows[0].id || parentRows[0].ID) : null;

    await db.query('INSERT INTO children (name, age, class_name, parent_id, parent_username) VALUES (?, ?, ?, ?, ?)', [name, parseInt(age), class_name, parent_id, parent_username]);
    const children = await db.query('SELECT * FROM children WHERE name = ? AND parent_username = ? ORDER BY id DESC LIMIT 1', [name, parent_username]);
    res.status(201).json(children[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to create child' }); }
});

app.delete('/api/children/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM children WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete child.' }); }
});

app.delete('/api/activities/child/:childId', async (req, res) => {
  try {
    await db.query('DELETE FROM activities WHERE child_id = ?', [parseInt(req.params.childId)]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete activities.' }); }
});

app.get('/api/activities', async (req, res) => {
  const { childId, limit } = req.query;
  try {
    let sql = `SELECT a.id, a.child_id, a.teacher_id, a.type, a.description, a.photo_url, a.timestamp, c.name as child_name, c.class_name, u.name as teacher_name FROM activities a JOIN children c ON a.child_id = c.id JOIN users u ON a.teacher_id = u.id`;
    let params = [];
    if (childId) { sql += ' WHERE a.child_id = ?'; params.push(childId); }
    sql += ' ORDER BY a.timestamp DESC, a.id DESC';
    if (limit) sql += ` LIMIT ${parseInt(limit)}`;
    res.json(await db.query(sql, params));
  } catch (err) { res.status(500).json({ error: 'Failed to retrieve activities' }); }
});

app.post('/api/activities', upload.single('photo'), async (req, res) => {
  const { childIds, teacherId, type, description } = req.body;
  let ids = [];
  try { ids = JSON.parse(childIds); if (!Array.isArray(ids)) ids = [ids]; }
  catch (e) { ids = typeof childIds === 'string' ? childIds.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x)) : [parseInt(childIds)]; }
  if (ids.length === 0) return res.status(400).json({ error: 'Valid childId required.' });

  let photo_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const teacher = await db.query('SELECT id, role FROM users WHERE id = ?', [teacherId]);
    if (teacher.length === 0 || teacher[0].role !== 'teacher') return res.status(400).json({ error: 'Invalid teacher ID.' });

    for (const childId of ids) {
      await db.query('INSERT INTO activities (child_id, teacher_id, type, description, photo_url) VALUES (?, ?, ?, ?, ?)', [childId, teacherId, type, description, photo_url]);
    }
    res.status(201).json({ success: true, count: ids.length, photo_url });
  } catch (err) { res.status(500).json({ error: 'Failed to log activities' }); }
});

// UPDATE USER PROFILE
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  try {
    if (password) {
      await db.query('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?', [name, email, password, parseInt(id)]);
    } else {
      await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, parseInt(id)]);
    }
    
    // Also update parent_username in children table if email changed
    await db.query('UPDATE children SET parent_username = ? WHERE parent_id = ?', [email, parseInt(id)]);
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// NEW ROUTE: DELETE ACTIVITY
app.delete('/api/activities/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM activities WHERE id = ?', [parseInt(id)]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete activity log.' });
  }
});

app.get('/api/counsellor/notes/:childId', async (req, res) => {
  try {
    const notes = await db.query(`SELECT n.id, n.child_id, n.counsellor_id, n.notes, n.recommendations, n.timestamp, u.name as counsellor_name FROM counsellor_notes n JOIN users u ON n.counsellor_id = u.id WHERE n.child_id = ? ORDER BY n.timestamp DESC, n.id DESC`, [req.params.childId]);
    res.json(notes);
  } catch (err) { res.status(500).json({ error: 'Failed to retrieve logs' }); }
});

app.post('/api/counsellor/notes', async (req, res) => {
  const { childId, counsellorId, notes, recommendations } = req.body;
  try {
    await db.query('INSERT INTO counsellor_notes (child_id, counsellor_id, notes, recommendations) VALUES (?, ?, ?, ?)', [parseInt(childId), parseInt(counsellorId), notes, recommendations]);
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to submit report' }); }
});

// Endpoint to update child stats
app.post('/api/children/:id/stats', async (req, res) => {
  const { water_intake, rest, focus } = req.body;
  try {
    await db.query('UPDATE children SET water_intake = ?, rest = ?, focus = ? WHERE id = ?', 
      [water_intake || null, rest || null, focus || null, parseInt(req.params.id)]);
    res.json({ success: true });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

// Daily reset at midnight (Early Morning)
setInterval(async () => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    try {
      await db.query('UPDATE children SET water_intake = NULL, rest = NULL, focus = NULL');
      console.log('Daily stats reset successfully.');
    } catch (err) {
      console.error('Failed to reset daily stats:', err);
    }
  }
}, 60000);

// Serve static frontend in production
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start Server safely
db.initializeSchema()
  .then(() => {
    if (process.env.CLEAN_ON_START === 'true') {
      resetDatabase().catch(err => console.error('Database reset error:', err));
    }
    app.use((err, req, res, next) => res.status(500).json({ error: err.message || 'Internal Server Error' }));
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Dynamic DB adapter running as: ${db.dbType()}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  });