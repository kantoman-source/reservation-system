import { VercelRequest }
from "@vercel/node";

import { db } from "./db";

export async function getSession(
  req: VercelRequest
) {

  const cookie =
    req.headers.cookie || "";

  const match =
    cookie.match(
      /admin_token=([^;]+)/
    );

  if (!match) {
    return null;
  }

  const token =
    match[1];

  const result =
    await db.query(
      `
      SELECT *
      FROM management_sessions
      WHERE token = $1
      AND expires_at > NOW()
      `,
      [token]
    );

  if (
    result.rows.length === 0
  ) {
    return null;
  }

  return result.rows[0];
}