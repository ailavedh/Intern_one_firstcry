const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Connecting to database:', dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Tables:', tables.map(t => t.name));

  db.all("SELECT * FROM users", [], (err, users) => {
    if (err) console.error(err);
    else console.log('Users in DB:', users);

    db.all("SELECT * FROM children", [], (err, kids) => {
      if (err) console.error(err);
      else console.log('Children in DB:', kids);

      db.all("SELECT * FROM activities", [], (err, acts) => {
        if (err) console.error(err);
        else console.log('Activities count in DB:', acts.length);

        db.all("SELECT * FROM counsellor_notes", [], (err, notes) => {
          if (err) console.error(err);
          else console.log('Counsellor notes count in DB:', notes.length);

          db.close();
        });
      });
    });
  });
});
