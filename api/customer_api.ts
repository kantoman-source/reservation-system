import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./db";
import { getManagementIdFromSlug } from "./shop_from_slug";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

   const { method, query, body } = req;

  // ==========================
  // 月単位の予約状況取得
  // GET /api/customer_api?month=2026-10&slug=yakitori_kanchan
  // ==========================
  if (method === "GET" && query.month) {

    const slug = query.slug as string;
    const management_id =
    await getManagementIdFromSlug(slug);

    if (!management_id) {
      return res.status(404).json({
      error: "shop not found"
     });
    }

    const [year, month] = (query.month as string)
      .split("-")
      .map(Number);

    const reservations_cnt = await db.query(
      `
      SELECT
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        time,
        COUNT(*) AS count
      FROM reservations
      WHERE management_id = $1
      AND EXTRACT(YEAR FROM date) = $2
      AND EXTRACT(MONTH FROM date) = $3
      GROUP BY date, time
      `,
      [
        management_id,
        year,
        month
      ]
    );

    const countMap: Record<string, number> = {};

    for (const row of reservations_cnt.rows) {
      countMap[
      `${row.date}_${row.time}`
      ] = Number(row.count);
    }

    return res.status(200).json(
      countMap
    );
  }

  // ==========================
  // 予約登録
  // POST /api/customer_api
  // ==========================
  if (method === "POST") {

    const {
      name,
      people,
      date,
      time,
      phone,
      slug
    } = body;

    const management_id =
    await getManagementIdFromSlug(slug);

    if (!management_id) {
      return res.status(404).json({
        error: "shop not found"
      });
    }

    const reservations_cnt = await db.query(
      `
      SELECT COUNT(*) AS c
      FROM reservations
      WHERE management_id = $1
      AND date = CAST($2 AS DATE)
      AND time = $3
      `,
      [
        management_id,
        date,
        time
      ]
    );

    const settingResult = await db.query(
    `
    SELECT 
      seats_per_table,
      table_count
    FROM shop_settings
    WHERE management_id = $1
    `,
    [management_id]
    );

    const maxPeople = settingResult.rows[0]?.seats_per_table ?? 4;
    const tableCount = settingResult.rows[0]?.table_count ?? 1;

    if (people > maxPeople) {
      return res.status(400).json({
        error: "人数が上限を超えています"
      });
    }

    const currentReservations = Number(reservations_cnt.rows[0].c);

    if (currentReservations >= tableCount) {
      return res.status(409).json({
        error: "満席です"
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
        management_id
      ]
    );

    return res.status(200).json({
      success: true,
      id: result.rows[0].id
    });
  }

  return res.status(405).json({
    error: "Method Not Allowed"
  });
}