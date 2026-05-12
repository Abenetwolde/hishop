// supabase/functions/telegram-auth/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

// Admin client - for user management
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

async function validateTelegramAuth(initDataRaw: string, token: string) {
  const params = new URLSearchParams(initDataRaw);
  const hash = params.get("hash");
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey("raw", encoder.encode("WebAppData"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const secret = await crypto.subtle.sign("HMAC", secretKey, encoder.encode(token));
  const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(dataCheckString));
  const hexSignature = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hexSignature === hash;
}

// Derive a deterministic password for this Telegram user
async function derivePassword(telegramId: number | string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(botToken), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`tg-user-${telegramId}`));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { initDataRaw } = await req.json();
    if (!initDataRaw) throw new Error("initDataRaw is required");

    const isValid = await validateTelegramAuth(initDataRaw, botToken);
    if (!isValid) throw new Error("Invalid Telegram data");

    const params = new URLSearchParams(initDataRaw);
    const tgUser = JSON.parse(params.get("user")!);
    const email = `tg_${tgUser.id}@telegram.mini.app`;
    const password = await derivePassword(tgUser.id);

    // Find or create auth user and set their derived password
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        telegram_id: tgUser.id,
        full_name: `${tgUser.first_name} ${tgUser.last_name || ""}`.trim(),
        avatar_url: tgUser.photo_url || "",
      },
    });

    let authUserId = authData?.user?.id;

    if (authError) {
      if (authError.status === 422 || (authError as any).code === "email_exists") {
        // User exists — update their password to ensure it's current
        const { data: listData } = await adminClient.auth.admin.listUsers();
        const existing = listData?.users?.find((u: any) => u.email === email);
        if (existing) {
          authUserId = existing.id;
          await adminClient.auth.admin.updateUserById(existing.id, { password });
        }
      } else {
        throw authError;
      }
    }

    if (!authUserId) throw new Error("Could not find or create auth user");

    // Upsert into public.users
    const { data: publicUser, error: upsertError } = await adminClient
      .from("users")
      .upsert({
        id: authUserId,
        email,
        type: "USER",
        avatar_url: tgUser.photo_url || "",
      }, { onConflict: "id" })
      .select()
      .single();
    if (upsertError) throw upsertError;

    // Sign in with the derived password to create a real session
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;

    return new Response(
      JSON.stringify({ user: publicUser, session: signInData.session }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Auth error:", error);
    return new Response(
      JSON.stringify({ error: error.message, details: error.toString() }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
