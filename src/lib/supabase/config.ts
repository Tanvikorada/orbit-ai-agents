// Supabase project for sign-in and saved runs. The publishable key is designed to be
// public (it ships to every browser); row-level security protects the data.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ietqlplvimjjkietrivu.supabase.co";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_f8KO1YZhKRVvIEQE9nZAKg_F9kUKoSm";

/** Live runs a signed-in user gets per day (UTC), unless they have the access code. */
export const DAILY_RUN_LIMIT = Number(process.env.DAILY_RUN_LIMIT) || 3;
