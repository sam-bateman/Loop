import { getSession } from "./session";

const AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const API = "https://api.prod.whoop.com/developer/v2";

export const SCOPES = [
  "read:recovery",
  "read:cycles",
  "read:sleep",
  "read:workout",
  "read:profile",
  "read:body_measurement",
  "offline",
].join(" ");

export function authorizeUrl(state: string) {
  const p = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID!,
    redirect_uri: process.env.WHOOP_REDIRECT_URI!,
    response_type: "code",
    scope: SCOPES,
    state,
  });
  return `${AUTH_URL}?${p}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: process.env.WHOOP_CLIENT_ID!,
    client_secret: process.env.WHOOP_CLIENT_SECRET!,
    redirect_uri: process.env.WHOOP_REDIRECT_URI!,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function refresh(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.WHOOP_CLIENT_ID!,
    client_secret: process.env.WHOOP_CLIENT_SECRET!,
    scope: "offline",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`refresh failed: ${res.status}`);
  return res.json();
}

/** Returns a valid access token, refreshing in place when it has expired. */
export async function accessToken(): Promise<string | null> {
  const session = await getSession();
  if (!session.accessToken) return null;
  if (session.expiresAt && Date.now() < session.expiresAt - 60_000) {
    return session.accessToken;
  }
  if (!session.refreshToken) return session.accessToken ?? null;
  try {
    const t = await refresh(session.refreshToken);
    session.accessToken = t.access_token;
    if (t.refresh_token) session.refreshToken = t.refresh_token;
    session.expiresAt = Date.now() + t.expires_in * 1000;
    await session.save();
    return t.access_token;
  } catch {
    return session.accessToken;
  }
}

async function get<T>(path: string, token: string): Promise<T | null> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

// ---- Response shapes (only the fields Loop reads) ----

export type Cycle = {
  id: number;
  start: string;
  end: string | null;
  score_state: string;
  score?: { strain: number; average_heart_rate: number; kilojoule: number };
};

export type Recovery = {
  cycle_id: number;
  created_at: string;
  score_state: string;
  score?: {
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
  };
};

export type Sleep = {
  id: string;
  start: string;
  end: string;
  nap: boolean;
  score_state: string;
  score?: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
    };
    sleep_performance_percentage: number | null;
    sleep_consistency_percentage: number | null;
    sleep_efficiency_percentage: number | null;
  };
};

export type Workout = {
  id: string;
  start: string;
  end: string;
  sport_name?: string;
  score_state: string;
  score?: {
    strain: number;
    average_heart_rate: number;
    zone_durations?: {
      zone_zero_milli: number;
      zone_one_milli: number;
      zone_two_milli: number;
      zone_three_milli: number;
      zone_four_milli: number;
      zone_five_milli: number;
    };
  };
};

export type Profile = { user_id: number; first_name: string; last_name: string };
export type Body = { height_meter: number; weight_kilogram: number; max_heart_rate: number };

type Paged<T> = { records: T[]; next_token?: string };

export type WhoopData = {
  profile: Profile | null;
  body: Body | null;
  cycles: Cycle[];
  recoveries: Recovery[];
  sleeps: Sleep[];
  workouts: Workout[];
};

/** Just the two cheap identity calls — used to prefill onboarding. */
export async function fetchBasics(token: string) {
  const [profile, body] = await Promise.all([
    get<Profile>("/user/profile/basic", token),
    get<Body>("/user/measurement/body", token),
  ]);
  return { profile, body };
}

/** Pulls the last `days` of everything Loop scores, in parallel. */
export async function fetchAll(token: string, days = 30): Promise<WhoopData> {
  const start = new Date(Date.now() - days * 86400_000).toISOString();
  const q = `?limit=25&start=${encodeURIComponent(start)}`;

  const [profile, body, cycles, recoveries, sleeps, workouts] = await Promise.all([
    get<Profile>("/user/profile/basic", token),
    get<Body>("/user/measurement/body", token),
    get<Paged<Cycle>>(`/cycle${q}`, token),
    get<Paged<Recovery>>(`/recovery${q}`, token),
    get<Paged<Sleep>>(`/activity/sleep${q}`, token),
    get<Paged<Workout>>(`/activity/workout${q}`, token),
  ]);

  return {
    profile,
    body,
    cycles: cycles?.records ?? [],
    recoveries: recoveries?.records ?? [],
    sleeps: sleeps?.records ?? [],
    workouts: workouts?.records ?? [],
  };
}
