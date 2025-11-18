// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health
app.get('/api/ping', (req, res) => res.json({ ok: true }));

/* ---------------------- EVENTS ---------------------- */
// List events
app.get('/api/events', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM events ORDER BY start_time');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single event
app.get('/api/events/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM events WHERE event_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create event
app.post('/api/events', async (req, res) => {
  try {
    const { title, description, venue, start_time, end_time, capacity, created_by } = req.body;
    const [result] = await pool.query(
      `INSERT INTO events(title,description,venue,start_time,end_time,capacity,created_by)
       VALUES(?,?,?,?,?,?,?)`,
      [title, description, venue, start_time, end_time, capacity, created_by]
    );
    const [rows] = await pool.query('SELECT * FROM events WHERE event_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update event
app.put('/api/events/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, venue, start_time, end_time, capacity } = req.body;
    await pool.query(
      `UPDATE events SET title=?, description=?, venue=?, start_time=?, end_time=?, capacity=? WHERE event_id=?`,
      [title, description, venue, start_time, end_time, capacity, id]
    );
    const [rows] = await pool.query('SELECT * FROM events WHERE event_id=?', [id]);
    res.json(rows[0]);
  } catch (err) {
    if (err && err.sqlState === '45000') return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE event_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ---------------------- USERS ---------------------- */
// List users
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT user_id, name, email, phone, role, can_create_events, can_manage_users, created_at FROM users ORDER BY user_id DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get user
app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT user_id, name, email, phone, role, can_create_events, can_manage_users FROM users WHERE user_id=?',[req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create user (calls sp_create_user if present, else direct insert)
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, phone, role='student', can_create_events=0, can_manage_users=0 } = req.body;
    const conn = await pool.getConnection();
    try {
      // Attempt stored procedure sp_create_user (if exists)
      let userId = null;
      try {
        await conn.query('SET @p_user_id = NULL;');
        await conn.query('CALL sp_create_user(?,?,?,?,?,@p_user_id);', [name, email, phone, role, can_create_events, can_manage_users]);
        const [r] = await conn.query('SELECT @p_user_id as uid;');
        userId = r?.[0]?.uid ?? null;
      } catch (procErr) {
        // fallback to direct insert
        const [ins] = await conn.query('INSERT INTO users(name,email,phone,role,can_create_events,can_manage_users) VALUES(?,?,?,?,?,?)',[name,email,phone,role,can_create_events,can_manage_users]);
        userId = ins.insertId;
      } finally {
        conn.release();
      }
      if (!userId) return res.status(500).json({ error: 'User creation failed' });
      const [rows] = await pool.query('SELECT user_id,name,email,phone,role,can_create_events,can_manage_users FROM users WHERE user_id=?',[userId]);
      res.status(201).json(rows[0]);
    } catch (inner) {
      conn.release();
      throw inner;
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update user basic fields
app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    await pool.query('UPDATE users SET name=?, email=?, phone=? WHERE user_id=?',[name,email,phone,req.params.id]);
    const [rows] = await pool.query('SELECT user_id, name, email, phone, role, can_create_events, can_manage_users FROM users WHERE user_id=?',[req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Change role/privileges via sp_change_role if present
app.put('/api/users/:id/role', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { role, can_create_events = 0, can_manage_users = 0, performed_by = null } = req.body;
    await pool.query('CALL sp_change_role(?,?,?,?,?,?)',[userId, role, can_create_events, can_manage_users, performed_by]);
    const [rows] = await pool.query('SELECT user_id, role, can_create_events, can_manage_users FROM users WHERE user_id=?',[userId]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete user
app.delete('/api/users/:id', async (req,res) => {
  try {
    await pool.query('DELETE FROM users WHERE user_id=?',[req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ---------------------- REGISTRATIONS ---------------------- */

// Create registration
app.post('/api/register', async (req, res) => {
  try {
    const { user_id, event_id } = req.body;
    if (!user_id || !event_id) return res.status(400).json({ error: 'user_id and event_id required' });

    const conn = await pool.getConnection();
    try {
      let msg = null;
      try {
        await conn.query('SET @p_msg = NULL;');
        await conn.query('CALL sp_register_user(?,?, @p_msg);', [user_id, event_id]);
        const [rows] = await conn.query('SELECT @p_msg as msg;');
        msg = rows?.[0]?.msg ?? 'Registration successful';
      } catch (procErr) {
        // fallback to direct insert
        try {
          await conn.query('INSERT INTO registrations(user_id,event_id) VALUES(?,?)', [user_id, event_id]);
          msg = 'Registration successful';
        } catch (insErr) {
          throw insErr;
        }
      } finally {
        conn.release();
      }
      return res.json({ message: msg || 'OK' });
    } catch (inner) {
      conn.release();
      throw inner;
    }
  } catch (err) {
    if (err && err.sqlState === '45000') return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: err.message });
  }
});

// List registrations (with user & event info)
app.get('/api/registrations', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.reg_id, r.user_id, r.event_id, r.status, r.reg_time,
             u.name as user_name, u.email as user_email,
             e.title as event_title, e.venue as event_venue
      FROM registrations r
      JOIN users u ON r.user_id = u.user_id
      JOIN events e ON r.event_id = e.event_id
      ORDER BY r.reg_time DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update registration status
app.put('/api/registrations/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!['registered', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Bad status' });
    await pool.query('UPDATE registrations SET status=? WHERE reg_id=?', [status, id]);
    const [rows] = await pool.query('SELECT * FROM registrations WHERE reg_id=?', [id]);
    res.json(rows[0]);
  } catch (err) {
    if (err && err.sqlState === '45000') return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

/* ---------------------- FEEDBACK ---------------------- */

// Submit feedback
app.post('/api/feedback', async (req,res) => {
  try {
    const { user_id, event_id, rating, comments } = req.body;
    const [result] = await pool.query('INSERT INTO feedback(user_id,event_id,rating,comments) VALUES(?,?,?,?)',[user_id,event_id,rating,comments]);
    const [rows] = await pool.query('SELECT * FROM feedback WHERE feed_id=?',[result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// List feedback
app.get('/api/feedback', async (req,res) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.*, u.name as user_name, e.title as event_title
      FROM feedback f
      JOIN users u ON f.user_id = u.user_id
      JOIN events e ON f.event_id = e.event_id
      ORDER BY f.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ---------------------- QUERIES (nested, join, aggregate) ---------------------- */

// Nested: users registered for events whose avg rating >= minRating
app.get('/api/queries/nested', async (req,res) => {
  try {
    const minRating = Number(req.query.minRating || 4);
    const sql = `
      SELECT u.user_id, u.name, u.email, r.event_id, e.title
      FROM users u
      JOIN registrations r ON u.user_id = r.user_id
      WHERE r.event_id IN (
        SELECT event_id FROM (
          SELECT event_id, AVG(rating) AS avg_rating
          FROM feedback
          GROUP BY event_id
        ) t WHERE t.avg_rating >= ?
      ) AND r.status='registered'
      ORDER BY u.user_id;
    `;
    const [rows] = await pool.query(sql, [minRating]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Join
app.get('/api/queries/join', async (req,res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.reg_id, r.status, r.reg_time,
             u.user_id, u.name AS user_name, u.email AS user_email,
             e.event_id, e.title AS event_title, e.venue
      FROM registrations r
      JOIN users u ON r.user_id = u.user_id
      JOIN events e ON r.event_id = e.event_id
      ORDER BY r.reg_time DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Aggregate: events with avg rating & occupancy
app.get('/api/queries/aggregate', async (req,res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.event_id, e.title, e.capacity, e.seats_taken,
             IFNULL(avg_tab.avg_rating,0) AS avg_rating,
             ROUND((e.seats_taken / GREATEST(e.capacity,1)) * 100,2) AS occupancy_percent
      FROM events e
      LEFT JOIN (
        SELECT event_id, AVG(rating) AS avg_rating FROM feedback GROUP BY event_id
      ) avg_tab ON e.event_id = avg_tab.event_id
      ORDER BY avg_rating DESC, occupancy_percent DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ---------------------- START SERVER ---------------------- */
const PORT = process.env.PORT || 4872;
const server = app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use. Set PORT env or change server.js fallback.`);
    process.exit(1);
  } else {
    console.error(err);
  }
});
