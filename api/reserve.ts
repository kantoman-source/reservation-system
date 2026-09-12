// import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './db'; // pg(Pool)

// export default async function handler(req: VercelRequest, res: VercelResponse) {
//   const { method, query, body } = req;

//   // GET /api/reserve → 全件
//   if (method === 'GET' && !query.id && !query.date && !query.month) {
//     const result = await db.query(
//       "SELECT * FROM reservations ORDER BY created_at DESC"
//     );
//     return res.status(200).json(result.rows);
//   }

//   // GET /api/reserve?id=xxx
//   if (method === 'GET' && query.id) {
//     const result = await db.query(
//       "SELECT * FROM reservations WHERE id = $1",
//       [query.id]
//     );
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Reservation not found" });
//     }
//     return res.status(200).json(result.rows[0]);
//   }

//   // GET /api/reserve?month=2026-10
//   if (method === 'GET' && query.month) {
//     const [year, month] = (query.month as string).split('-').map(Number);

//     const result = await db.query(
//       "SELECT date, time FROM reservations WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2",
//       [year, month]
//     );

//     return res.status(200).json(result.rows);
//   }

//   // GET /api/reserve?date=2026-10-01
//   if (method === 'GET' && query.date) {
//     const date = query.date as string;

//     const slots = [];
//     for (let h = 11; h <= 22; h++) {
//       slots.push(`${String(h).padStart(2, "0")}:00`);
//     }

//     const result: Record<string, string> = {};

//     for (const time of slots) {
//       const count = await db.query(
//         "SELECT COUNT(*) AS c FROM reservations WHERE date = CAST($1 AS DATE) AND time = $2",
//         [date, time]
//       );
//       result[time] = Number(count.rows[0].c) === 0 ? "○" : "×";
//     }

//     return res.status(200).json(result);
//   }

//   // POST /api/reserve
//   if (method === 'POST') {
//     const { name, people, date, time, phone } = body;

//     // 重複チェック
//     const exists = await db.query(
//       "SELECT COUNT(*) AS c FROM reservations WHERE date = CAST($1 AS DATE) AND time = $2",
//       [date, time]
//     );

//     if (Number(exists.rows[0].c) > 0) {
//       return res.status(409).json({ error: "その日時はすでに予約済みです" });
//     }

//     // 登録
//     const result = await db.query(
//       "INSERT INTO reservations (name, people, date, time, phone) VALUES ($1, $2, CAST($3 AS DATE), $4, $5) RETURNING id",
//       [name, people, date, time, phone]
//     );

//     return res.status(200).json({ success: true, id: result.rows[0].id });
//   }

//   return res.status(405).send("Method Not Allowed");
// }

export default async function handler(req, res) {
  try {
    const result = await db.query('SELECT 1');
    return res.status(200).json(result.rows);
    } catch (err) {
    return res.status(500).json({
    error: String(err)
    });
  }
}