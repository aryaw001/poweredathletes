import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Local MySQL Connection
const localDb = mysql.createPool({
  host: process.env.LOCAL_DB_HOST,
  user: process.env.LOCAL_DB_USER,
  password: process.env.LOCAL_DB_PASS,
  database: process.env.LOCAL_DB_NAME,
  port: process.env.LOCAL_DB_PORT,
});

// Hostinger MySQL Connection
const hostingerDb = mysql.createPool({
  host: process.env.HOSTINGER_DB_HOST,
  user: process.env.HOSTINGER_DB_USER,
  password: process.env.HOSTINGER_DB_PASS,
  database: process.env.HOSTINGER_DB_NAME,
  port: process.env.HOSTINGER_DB_PORT,
});

// REGISTER
app.post('/api/register', async (req, res) => {
  const { name, age, weight, email, password } = req.body;
  try {
    await localDb.execute(
      'INSERT INTO users (name, age, weight, email, password, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [name, age, weight, email, password]
    );
    await hostingerDb.execute(
      'INSERT INTO users (name, age, weight, email, password, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [name, age, weight, email, password]
    );
    res.status(200).json({ message: 'User registered in both databases' });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// LOGIN (only from local, or you can check both if needed)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await localDb.execute(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// SAVE MEASUREMENT TO BOTH DATABASES
app.post('/api/measurements', async (req, res) => {
  const {
    user_id,
    name = 'Unknown',
    age = 0,
    weight = 0,
    crownHeight = 0,
    shoulderHeight = 0,
    elbowReach = 0,
    hipHeight = 0,
    handReach = 0,
    kneeHeight = 0,
    ankleHeight = 0,
  } = req.body;

  const sql = `INSERT INTO measurements 
    (user_id, name, age, weight, date, crownHeight, shoulderHeight, elbowReach, hipHeight, handReach, kneeHeight, ankleHeight)
    VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    user_id,
    name,
    age,
    weight,
    crownHeight,
    shoulderHeight,
    elbowReach,
    hipHeight,
    handReach,
    kneeHeight,
    ankleHeight,
  ];

  try {
    await localDb.execute(sql, params);
    await hostingerDb.execute(sql, params);

    res.status(201).json({ message: 'Measurement saved to both databases' });
  } catch (err) {
    console.error('Error saving measurement:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// FETCH MEASUREMENT HISTORY (from local, or you can add a route for Hostinger)
app.get('/api/measurements/:user_id', async (req, res) => {
  const userId = req.params.user_id;
  try {
    const [results] = await localDb.execute(
      `SELECT * FROM measurements WHERE user_id = ? ORDER BY date DESC`,
      [userId]
    );
    res.json(results);
  } catch (err) {
    console.error('Fetch Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ SERVER START
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
