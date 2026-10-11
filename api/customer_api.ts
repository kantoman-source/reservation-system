import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./db";

  //slugからmanagement_idを取得
async function getManagementIdFromSlug(
  slug: string
  ): Promise<number | null> {

    const result = await db.query(
      `
      SELECT management_id
      FROM management_users
      WHERE slug = $1
      `,
      [slug]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].management_id;
}

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
        management_id,
        year,
        month
      ]
    );

    return res.status(200).json(
      result.rows
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

    const exists = await db.query(
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

    if (
      Number(exists.rows[0].c) > 0
    ) {
      return res.status(409).json({
        error: "その日時はすでに予約済みです"
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