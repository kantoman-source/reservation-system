import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  res.setHeader(
    "Set-Cookie",
    [
      "admin_auth=true; Path=/; HttpOnly; Secure; SameSite=Strict"
    ]
  );

  return res.status(200).json({
    success: true
  });
}
