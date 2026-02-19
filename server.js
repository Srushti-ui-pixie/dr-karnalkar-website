require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// SQLite Database Setup
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'appointments.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ SQLite connection error:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDB();
  }
});

function initializeDB() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientName TEXT NOT NULL,
      patientAge TEXT,
      patientEmail TEXT,
      patientPhone TEXT,
      patientGender TEXT,
      appointmentDate TEXT,
      appointmentTime TEXT,
      consultationColumn TEXT,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`, () => {
      db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES ('appointment_phone', '9420044076')`);
    });
  });
}

// Promisified DB helpers
const dbAll = (query, params = []) => new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows));
});

const dbGet = (query, params = []) => new Promise((resolve, reject) => {
  db.get(query, params, (err, row) => err ? reject(err) : resolve(row));
});

const dbRun = (query, params = []) => new Promise((resolve, reject) => {
  db.run(query, params, function (err) {
    err ? reject(err) : resolve({ id: this.lastID, changes: this.changes });
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'enhanced_website.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

const PORT = process.env.PORT || 5000;

// Notification Config
const doctorEmail = process.env.DOCTOR_EMAIL || '';
const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const transporter = smtpHost && smtpUser && smtpPass ? nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: { user: smtpUser, pass: smtpPass }
}) : null;

const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
const whatsappTo = process.env.DOCTOR_WHATSAPP_TO;

app.get('/health', (_, res) => res.json({ status: 'ok', database: 'sqlite' }));

app.get('/api/appointments', async (req, res) => {
  try {
    const list = await dbAll('SELECT id AS _id, * FROM appointments ORDER BY createdAt DESC');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  const { patientName, patientEmail, patientPhone, patientGender, appointmentDate, appointmentTime, consultationColumn, patientAge } = req.body || {};
  if (!patientName || !appointmentDate || !appointmentTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await dbRun(
      `INSERT INTO appointments (patientName, patientEmail, patientPhone, patientGender, patientAge, appointmentDate, appointmentTime, consultationColumn) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [patientName, patientEmail, patientPhone, patientGender, patientAge, appointmentDate, appointmentTime, consultationColumn]
    );
    res.status(201).json({ message: 'Appointment stored', appointment: { _id: result.id, patientName } });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await dbAll('SELECT * FROM settings');
    const settingsObj = {};
    settings.forEach(s => settingsObj[s.key] = s.value);
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  const settings = req.body; // Expecting { key: value, ... }
  try {
    const promises = Object.entries(settings).map(([key, value]) => {
      return dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    });
    await Promise.all(promises);
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.post('/api/appointments/:id/confirm', async (req, res) => {
  const { id } = req.params;

  try {
    const appt = await dbGet('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    await dbRun('UPDATE appointments SET status = ? WHERE id = ?', ['confirmed', id]);

    const notifications = { email: { status: 'skipped' }, whatsapp: { status: 'skipped' } };

    if (transporter && doctorEmail) {
      try {
        await transporter.sendMail({
          from: `"Appointment Bot" <${smtpUser}>`,
          to: doctorEmail,
          subject: `New Appointment Confirmed: ${appt.patientName}`,
          text: `Appointment confirmed:\n\nPatient: ${appt.patientName}\nPhone: ${appt.patientPhone}\nDate: ${appt.appointmentDate}\nTime: ${appt.appointmentTime}\nConsultation: ${appt.consultationColumn || 'N/A'}`,
        });
        notifications.email = { status: 'sent' };
      } catch (err) { notifications.email = { status: 'error', message: err.message }; }
    }

    if (twilioClient && whatsappFrom && whatsappTo) {
      try {
        await twilioClient.messages.create({
          from: `whatsapp:${whatsappFrom}`,
          to: `whatsapp:${whatsappTo}`,
          body: `New Appointment Confirmed!\nPatient: ${appt.patientName}\nPhone: ${appt.patientPhone}\nDate: ${appt.appointmentDate}\nTime: ${appt.appointmentTime}`,
        });
        notifications.whatsapp = { status: 'sent' };
      } catch (err) { notifications.whatsapp = { status: 'error', message: err.message }; }
    }

    res.json({ message: 'Appointment confirmed', notifications, warning: (!transporter || !twilioClient) ? 'Notifications skipped due to config' : null });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ Attempting to delete appointment ID: ${id}`);
  try {
    const result = await dbRun('DELETE FROM appointments WHERE id = ?', [parseInt(id, 10)]);
    console.log(`Result: ${result.changes} changes`);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error(`❌ Delete failed for ID ${id}:`, err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`
🚀 Hospital Backend Running (SQLite Mode)!
----------------------------
Main Website: http://localhost:${PORT}/
Admin Dashboard: http://localhost:${PORT}/admin
----------------------------
  `);
});
