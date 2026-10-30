import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./db";
import { getSession } from "./auth";
import { getManagementIdFromSlug } from "./shop_from_slug";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  const { method, body, query } = req;

  // ==========================
  // 設定取得
  // GET /api/shop_settings_api
  // ==========================
  if (method === "GET") {
    const slug = query.slug as string;
    let management_id: number | null = null;
  //客側画面から
    if (query.slug) {
      management_id = await getManagementIdFromSlug(slug);
      if (!management_id) {
        return res.status(404).json({
        error: "shop not found"
        });
      } 
    }
    //管理者側画面から
    else {
      const session = await getSession(req);
      if (!session) {
        return res.status(401).json({
          error: "unauthorized"
        });
      }
      management_id = session.management_id;
    }
    const result = await db.query(
      `
      SELECT
        seats_per_table,
        table_count,
        open_time,
        close_time,
        holidays
      FROM shop_settings
      WHERE management_id = $1
      `,
      [management_id]
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
  // ログインチェック
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({
      ok: false
    });
  }

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
        session.management_id,
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