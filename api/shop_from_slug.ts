import { db } from "./db";

export async function getManagementIdFromSlug(
  slug: string
): Promise<number | null> {

  const result = await db.query(
    `
    SELECT management_id
    FROM management_users
    WHERE slug = $1
    `,
    [slug]
  );

  return result.rows[0]?.management_id ?? null;
}