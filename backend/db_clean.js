const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Clearing database records (preserving only admin)...');

db.serialize(() => {
  db.run("DELETE FROM activities", (err) => {
    if (err) console.error('Error clearing activities:', err);
    else console.log('Cleared activities table.');
  });

  db.run("DELETE FROM counsellor_notes", (err) => {
    if (err) console.error('Error clearing counsellor_notes:', err);
    else console.log('Cleared counsellor_notes table.');
  });

  db.run("DELETE FROM children", (err) => {
    if (err) console.error('Error clearing children:', err);
    else console.log('Cleared children table.');
  });

  db.run("DELETE FROM users WHERE email != 'admin@school.com'", (err) => {
    if (err) console.error('Error clearing users:', err);
    else console.log('Cleared users table (except administrator).');
  });

  // Reset sqlite sequence to make sure IDs start fresh
  db.run("DELETE FROM sqlite_sequence", (err) => {
    if (err) console.error('Error resetting sequences:', err);
    else console.log('Reset auto-increment sequences.');
  });

  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) console.error(err);
    else console.log('Remaining users in database:', rows);
    db.close();
  });
});
