import { db } from "@/db";
import { sql } from "drizzle-orm";

type UsersColumnFlags = {
  usersRole: boolean;
  usersLastSeen: boolean;
};

let cachedFlags: UsersColumnFlags | null = null;
let pending: Promise<UsersColumnFlags> | null = null;

export async function getUsersColumnFlags(): Promise<UsersColumnFlags> {
  if (cachedFlags) return cachedFlags;
  if (pending) return pending;

  pending = (async () => {
    try {
      const result = await db.execute(sql`
        select column_name
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'users'
          and column_name in ('role', 'last_seen_at')
      `);

      const rows = Array.isArray(result)
        ? result
        : // drizzle execute returns `{ rows }` on some drivers
          ((result as { rows?: Array<{ column_name?: string }> }).rows ?? []);

      const names = new Set(
        rows.map((row: { column_name?: string }) => row.column_name).filter(Boolean) as string[]
      );

      cachedFlags = {
        usersRole: names.has("role"),
        usersLastSeen: names.has("last_seen_at"),
      };
    } catch (error) {
      console.warn("[dbIntrospection] failed to load users columns", error);
      cachedFlags = { usersRole: true, usersLastSeen: true };
    }

    return cachedFlags;
  })();

  return pending;
}
