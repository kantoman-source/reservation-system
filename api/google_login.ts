import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./db";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

const client =
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
  );

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  const { idToken } = req.body;
  
  console.log("BODY", req.body);

  if (!idToken) {
    return res.status(400).json({
      error: "idTokenがありません"
    });
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience:
    process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();

  if (!payload) {
    return res.status(401).json({
      error: "Google認証失敗"
    });
  }

  const googleSub = payload.sub;

  const result = await db.query(
    `
    SELECT *
    FROM management_users
    WHERE google_sub = $1
    `,
    [googleSub]
  );

  if (result.rows.length === 0) {

    console.log("email:", payload.email);
    console.log("google_sub:", payload.sub);
    return res.status(403).json({
      error: "管理者登録されていません",
      email: payload.email,
      google_sub: payload.sub
    });
  }

  const managementId =
  result.rows[0].management_id;

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
  // 管理者Cookie発行
  res.setHeader(
    "Set-Cookie",
    [
      `admin_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`
    ]
  );

  return res.status(200).json({
    success: true
  });
}
