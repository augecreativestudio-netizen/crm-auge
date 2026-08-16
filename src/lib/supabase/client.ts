import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

/**
 * Supabase client for use in Client Components ("use client").
 * Session is persisted in cookies so the server client (and Proxy) can read it too.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
