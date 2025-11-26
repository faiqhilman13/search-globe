import type { Country, RegionsMap, Trend } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const API_TOKEN = import.meta.env.VITE_API_TOKEN || "";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`,
      ...(init.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchRegions(): Promise<{ regions: RegionsMap; countries: Country[] }> {
  return request("/regions");
}

export async function fetchTrends(params: {
  country: string;
  windowDays: number;
  breakoutOnly: boolean;
  limit?: number;
}): Promise<{ data: Trend[] }> {
  const { country, windowDays, breakoutOnly, limit = 20 } = params;
  const qs = new URLSearchParams({
    country,
    windowDays: String(windowDays),
    breakoutOnly: String(breakoutOnly),
    limit: String(limit)
  });
  return request(`/trends?${qs.toString()}`);
}

export async function fetchTopByRegion(params: {
  region: string;
  windowDays: number;
  limit?: number;
}): Promise<{ data: Trend[] }> {
  const { region, windowDays, limit = 20 } = params;
  const qs = new URLSearchParams({
    region,
    windowDays: String(windowDays),
    limit: String(limit)
  });
  return request(`/top?${qs.toString()}`);
}
