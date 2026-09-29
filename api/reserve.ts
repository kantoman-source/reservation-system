import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './db';

const MANAGEMENT_ID = 1;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { method, query, body } = req;

  // GET /api/reserve
  if (
    method === 'GET' &&
    !query.id &&
    !query.date &&
    !query.month
  ) {
    const result = await db.query(
      `
      SELECT
        id,
        management_id,
        name,
        people,
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        time,
        phone,
        visited,
        created_at
      FROM reservations
      WHERE management_id = $1
      ORDER BY created_at DESC
      `,
      [MANAGEMENT_ID]
    );

    return res.status(200).json(result.rows);
  }

  // GET /api/reserve?id=xxx
  if (method === 'GET' && query.id) {
    const result = await db.query(
      `
      SELECT *
      FROM reservations
      WHERE id = $1
      AND management_id = $2
      `,
      [
        query.id,
        MANAGEMENT_ID
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Reservation not found'
      });
    }

    return res.status(200).json(result.rows[0]);
  }

  // GET /api/reserve?month=2026-10 のように、月単位で予約状況を取得
  if (method === 'GET' && query.month) {
    const [year, month] = (query.month as string)
      .split('-')
      .map(Number);

    const result = await db.query(
      `
      SELECT
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        time
      FROM reservations
      WHERE management_id = $1
      AND EXTRACT(YEAR FROM date) = $2
      AND EXTRACT(MONTH FROM date) = $3
      `,
      [
        MANAGEMENT_ID,
        year,
        month
      ]
    );

    return res.status(200).json(result.rows);
  }

  // GET /api/reserve?date=2026-10-01 日にちで一件取得
  if (method === 'GET' && query.date) {
    const date = query.date as string;

    const slots: string[] = [];

    for (let h = 11; h <= 22; h++) {
      slots.push(
        `${String(h).padStart(2, '0')}:00`
      );
    }

    const result: Record<string, string> = {};

    for (const time of slots) {
      const count = await db.query(
        `
        SELECT COUNT(*) AS c
        FROM reservations
        WHERE date = CAST($1 AS DATE)
        AND time = $2
        AND management_id = $3
        `,
        [
          date,
          time,
          MANAGEMENT_ID
        ]
      );

      result[time] =
        Number(count.rows[0].c) === 0
          ? '○'
          : '×';
    }

    return res.status(200).json(result);
  }

  // POST /api/reserve
  if (method === 'POST') {
    const {
      name,
      people,
      date,
      time,
      phone
    } = body;

    const exists = await db.query(
      `
      SELECT COUNT(*) AS c
      FROM reservations
      WHERE management_id = $1
      AND date = CAST($2 AS DATE)
      AND time = $3
      `,
      [
        MANAGEMENT_ID,
        date,
        time
      ]
    );

    if (Number(exists.rows[0].c) > 0) {
      return res.status(409).json({
        error: 'その日時はすでに予約済みです'
      });
    }

    const result = await db.query(
      `
      INSERT INTO reservations
      (
        name,
        people,
        date,
        time,
        phone,
        management_id
      )
      VALUES
      (
        $1,
        $2,
        CAST($3 AS DATE),
        $4,
        $5,
        $6
      )
      RETURNING id
      `,
      [
        name,
        people,
        date,
        time,
        phone,
        MANAGEMENT_ID
      ]
    );

    return res.status(200).json({
      success: true,
      id: result.rows[0].id
    });
  }

  // PATCH /api/reserve
  if (method === 'PATCH') {
    const {
      id,
      visited
    } = body;

    const result = await db.query(
      `
      UPDATE reservations
      SET visited = $1
      WHERE id = $2
      AND management_id = $3
      RETURNING *
      `,
      [
        visited,
        id,
        MANAGEMENT_ID
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Reservation not found'
      });
    }

    return res.status(200).json({
      success: true,
      reservation: result.rows[0]
    });
  }

  // DELETE /api/reserve
  if (method === 'DELETE') {
    const { ids } = body;

    if (!ids || ids.length === 0) {
      return res.status(400).json({
        error: 'No ids provided'
      });
    }

    const result = await db.query(
      `
      DELETE FROM reservations
      WHERE id = ANY($1::int[])
      AND management_id = $2
      RETURNING *
      `,
      [
        ids,
        MANAGEMENT_ID
      ]
    );

    return res.status(200).json({
      success: true,
      deletedCount: result.rows.length
    });
  }

  return res
    .status(405)
    .send('Method Not Allowed');
}