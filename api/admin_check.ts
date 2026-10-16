import { VercelRequest, VercelResponse } from "@vercel/node";
import { getSession } from "./auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const session = await getSession(req);

  if (!session) {
    return res.status(401).json({
      ok: false
    });
  }

  return res.status(200).json({
    ok: true
  });
}
