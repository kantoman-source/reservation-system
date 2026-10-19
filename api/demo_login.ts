import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./db";
import crypto from "crypto";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  const { managementId } = req.body;

  if (
    managementId !== 1 &&
    managementId !== 2
  ) {
    return res.status(400).json({
      error: "不正な店舗"
    });
  }

  const token =
    crypto.randomBytes(32).toString("hex");

  await db.query(
    `
    INSERT INTO management_sessions
    (
      token,
      management_id,
      expires_at,
      created_at
    )
    VALUES
    (
      $1,
      $2,
      NOW() + interval '30 days',
      NOW()
    )
    `,
    [token, managementId]
  );

  res.setHeader(
    "Set-Cookie",
    `admin_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax`
  );

  return res.status(200).json({
    success: true
  });
}