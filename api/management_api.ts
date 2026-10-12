import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./db";
import { getSession} from "./auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  //google login チェック
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({
      ok:false
    });
  }

  const MANAGEMENT_ID = session.management_id;
  const { method, query, body } = req;

  // ==========================
  // 予約一覧取得
  // GET /api/management_api
  // ==========================
  if (method === "GET" && !query.id) {

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

    return res.status(200).json(
      result.rows
    );
  }

  // ==========================
  // 個別予約取得
  // GET /api/management_api?id=1
  // ==========================
  if (method === "GET" && query.id) {

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
        error: "Reservation not found"
      });

    }

    return res.status(200).json(
      result.rows[0]
    );
  }

  // ==========================
  // 来店済み更新
  // PATCH /api/management_api
  // ==========================
  if (method === "PATCH") {

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
        error: "Reservation not found"
      });

    }

    return res.status(200).json({
      success: true,
      reservation:
        result.rows[0]
    });
  }

  // ==========================
  // 予約削除
  // DELETE /api/management_api
  // ==========================
  if (method === "DELETE") {

    const { ids } = body;

    if (
      !ids ||
      ids.length === 0
    ) {

      return res.status(400).json({
        error: "No ids provided"
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
      deletedCount:
        result.rows.length
    });
  }

  return res.status(405).json({
    error: "Method Not Allowed"
  });
}