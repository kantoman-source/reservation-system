import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './db';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query, body } = req;

  // -------------------------
  // GET /api/reserve → 予約一覧
  // -------------------------
  if (method === 'GET' && !query.id && !query.date) {
    const stmt = db.prepare("SELECT * FROM reservations ORDER BY created_at DESC");
    const reservations = stmt.all();
    return res.status(200).json(reservations);
  }

  // -------------------------
  // GET /api/reserve?id=123 → 予約1件取得
  // -------------------------
  if (method === 'GET' && query.id) {
    const stmt = db.prepare("SELECT * FROM reservations WHERE id = ?");
    const reservation = stmt.get(query.id);

    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    return res.status(200).json(reservation);
  }

  // -------------------------
  // GET /api/reserve?date=2024-01-01 → 空き状況
  // -------------------------
  if (method === 'GET' && query.date) {
    const date = query.date as string;

    const slots: string[] = [];
    for (let h = 11; h <= 22; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`);
    }

    const result: Record<string, string> = {};

    for (const time of slots) {
      const stmt = db.prepare(
        "SELECT COUNT(*) AS c FROM reservations WHERE date = ? AND time = ?"
      );

      const count = stmt.get(date, time) as { c: number };
      result[time] = count.c === 0 ? "○" : "×";
    }

    return res.status(200).json(result);
  }

  // -------------------------
  // POST /api/reserve → 新規予約
  // -------------------------
  if (method === 'POST') {
    const { name, people, date, time, phone } = body;

    const stmt = db.prepare(`
      INSERT INTO reservations (name, people, date, time, phone)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(name, people, date, time, phone);

    return res.status(200).json({ success: true, id: result.lastInsertRowid });
  }

  // -------------------------
  // その他は拒否
  // -------------------------
  return res.status(405).send("Method Not Allowed");
}
