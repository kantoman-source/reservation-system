import Database from "better-sqlite3";
import path from "path";

// Vercelでは process.cwd() がプロジェクトのルートになる
const dbPath = path.join(process.cwd(), "database.db");

export const db = new Database(dbPath);

// 初回起動時にテーブルを作成
db.exec(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    people INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    phone TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);
