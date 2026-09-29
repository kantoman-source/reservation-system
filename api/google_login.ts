import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./db";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({
        error: "Method Not Allowed"
      });
  }

  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({
        error: "メールアドレスがありません"
      });
  }

  const result =
    await db.query(
      `
      SELECT *
      FROM management_users
      WHERE email = $1
      `,
      [email]
    );

  if (result.rows.length === 0) {

    return res
      .status(403)
      .json({
        error:
          "管理者登録されていません"
      });
  }

  return res
    .status(200)
    .json({
      success: true
    });
}