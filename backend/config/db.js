const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { Pool } = require('pg');
require('dotenv').config();

let dbType = 'sqlite';
let pgPool = null;
let sqliteDb = null;

if (process.env.DATABASE_URL) {
  dbType = 'postgres';
  console.log('Database configuration: PostgreSQL (Cloud)');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  dbType = 'sqlite';
  console.log('Database configuration: SQLite (Local db.sqlite)');
  const dbPath = path.resolve(__dirname, '../db.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);
}

// Unified query wrapper - FIXED FOR DELETE COMMANDS
async function query(sql, params = []) {
  if (dbType === 'postgres') {
    let paramIndex = 1;
    const postgresSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await pgPool.query(postgresSql, params);
    return result.rows;
  } else {
    return new Promise((resolve, reject) => {
      // If it's a SELECT query, use .all
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } else {
        // If it's DELETE, INSERT, or UPDATE, use .run
        sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve(this);
        });
      }
    });
  }
}

async function initializeSchema() {
  if (dbType === 'postgres') {
    await query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, role VARCHAR(100) NOT NULL, password VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
    await query(`CREATE TABLE IF NOT EXISTS children (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, age INT NOT NULL, class_name VARCHAR(255) NOT NULL, parent_id INT REFERENCES users(id) ON DELETE SET NULL, parent_username VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
    await query(`CREATE TABLE IF NOT EXISTS activities (id SERIAL PRIMARY KEY, child_id INT NOT NULL REFERENCES children(id) ON DELETE CASCADE, teacher_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, type VARCHAR(100) NOT NULL, description TEXT NOT NULL, photo_url VARCHAR(255), timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
    await query(`CREATE TABLE IF NOT EXISTS counsellor_notes (id SERIAL PRIMARY KEY, child_id INT NOT NULL REFERENCES children(id) ON DELETE CASCADE, counsellor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, notes TEXT NOT NULL, recommendations TEXT NOT NULL, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
  } else {
    await query(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL, password TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
    await query(`CREATE TABLE IF NOT EXISTS children (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, age INTEGER NOT NULL, class_name TEXT NOT NULL, parent_id INTEGER, parent_username TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL);`);
    await query(`CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, child_id INTEGER NOT NULL, teacher_id INTEGER NOT NULL, type TEXT NOT NULL, description TEXT NOT NULL, photo_url TEXT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE, FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE);`);
    await query(`CREATE TABLE IF NOT EXISTS counsellor_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, child_id INTEGER NOT NULL, counsellor_id INTEGER NOT NULL, notes TEXT NOT NULL, recommendations TEXT NOT NULL, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE, FOREIGN KEY (counsellor_id) REFERENCES users(id) ON DELETE CASCADE);`);
  }

  const adminCheck = await query("SELECT id FROM users WHERE role = 'admin'");
  if (adminCheck.length === 0) {
    await query('INSERT INTO users (name, email, role, password) VALUES (?, ?, ?, ?)', ['admin', 'admin123@gmail.com', 'admin', 'Aila@2007']);
  }

  // Ensure new columns exist for stats (SQLite ignores duplicate column errors if we catch them, or we can use PRAGMA but try-catch is easiest)
  try { await query('ALTER TABLE children ADD COLUMN water_intake VARCHAR(100)'); } catch (e) {}
  try { await query('ALTER TABLE children ADD COLUMN rest VARCHAR(100)'); } catch (e) {}
  try { await query('ALTER TABLE children ADD COLUMN focus VARCHAR(100)'); } catch (e) {}
}

async function resetDatabase() {
  await query("DELETE FROM users WHERE role != 'admin'");
  await query('DELETE FROM children');
  await query('DELETE FROM activities');
  await query('DELETE FROM counsellor_notes');
}

module.exports.query = query;
module.exports.resetDatabase = resetDatabase;
module.exports.initializeSchema = initializeSchema;
module.exports.dbType = () => dbType;