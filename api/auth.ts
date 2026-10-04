import { VercelRequest } from "@vercel/node";

export function isAdmin(
  req: VercelRequest
) {
  const cookie =
    req.headers.cookie || "";

  return cookie.includes(
    "admin_auth=true"
  );
}
