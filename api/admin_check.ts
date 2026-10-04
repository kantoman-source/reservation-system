import { VercelRequest, VercelResponse }
from "@vercel/node";

import { isAdmin } from "./auth";

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  if (!isAdmin(req)) {
    return res.status(401).json({
      ok: false
    });
  }

  return res.status(200).json({
    ok: true
  });
}