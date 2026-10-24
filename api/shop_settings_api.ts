import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./db";
import { getSession } from "./auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // ログインチェック
  const session = await getSession(req);

  if (!session) {
    return res.status(401).json({
      ok: false
    });
  }

  const MANAGEMENT_ID = session.management_id;
  const { method, body } = req;

  // ==========================
  // 設定取得
  // GET /api/shop_settings_api
  // ==========================
  if (method === "GET") {
    const result = await db.query(
      `
      SELECT *
      FROM shop_settings
      WHERE management_id = $1
      `,
      [MANAGEMENT_ID]
    );

    return res.status(200).json(
      result.rows[0] || null
    );
  }

  // ==========================
  // 設定保存
  // POST /api/shop_settings_api
  // ==========================
  if (method === "POST") {
    const {
      table_count,
      seats_per_table,
      open_time,
      close_time,
      slot_duration,
      stay_duration,
      holidays
    } = body;

    const result = await db.query(
      `
      INSERT INTO shop_settings (
        management_id,
        table_count,
        seats_per_table,
        open_time,
        close_time,
        slot_duration,
        stay_duration,
        holidays
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8
      )
      ON CONFLICT (management_id)
      DO UPDATE SET
        table_count = EXCLUDED.table_count,
        seats_per_table = EXCLUDED.seats_per_table,
        open_time = EXCLUDED.open_time,
        close_time = EXCLUDED.close_time,
        slot_duration = EXCLUDED.slot_duration,
        stay_duration = EXCLUDED.stay_duration,
        holidays = EXCLUDED.holidays
      RETURNING *
      `,
      [
        MANAGEMENT_ID,
        table_count,
        seats_per_table,
        open_time,
        close_time,
        slot_duration,
        stay_duration,
        holidays
      ]
    );

    return res.status(200).json({
      success: true,
      settings: result.rows[0]
    });
  }

  return res.status(405).json({
    error: "Method Not Allowed"
  });
}