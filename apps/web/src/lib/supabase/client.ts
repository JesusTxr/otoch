import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let authListenerRegistrado = false;

export function createClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY) en apps/web/.env.local"
    );
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseKey);

  // Mantiene sincronizado el JWT en el WebSocket de Supabase Realtime (clave con sb_publishable_)
  if (typeof window !== "undefined" && !authListenerRegistrado) {
    authListenerRegistrado = true;
    browserClient.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        browserClient?.realtime.setAuth(session.access_token);
      }
    });
  }

  return browserClient;
}
