import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./db";
import { getSession } from "./auth";
import { getManagementIdFromSlug } from "./shop_from_slug";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { query } = req;

  if (req.method === "GET") {
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
      SELECT shop_name
      FROM management_table
      WHERE management_id = $1
      `,
      [management_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "shop not found"
      });
    }

    return res.status(200).json({
      shop_name: result.rows[0].shop_name
    });
  }

  return res.status(405).json({
    error: "Method Not Allowed"
  });
}