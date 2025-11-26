import pLimit from "p-limit";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import dotenv from "dotenv";
import { db, initDb } from "./db.js";
import { allCountries, regions } from "./countries.js";

dotenv.config();
initDb();

const concurrency = pLimit(2);

const insertTermStmt = db.prepare(`
  INSERT INTO terms (country_code, term, ts_date, score, change_pct, breakout_flag, payload_json)
  VALUES (@country_code, @term, @ts_date, @score, @change_pct, @breakout_flag, @payload_json)
  ON CONFLICT(country_code, term, ts_date) DO UPDATE SET
    score=excluded.score,
    change_pct=excluded.change_pct,
    breakout_flag=excluded.breakout_flag,
    payload_json=excluded.payload_json
`);

const prevScoreStmt = db.prepare(`
  SELECT score FROM terms
  WHERE country_code = ? AND term = ? AND ts_date < ?
  ORDER BY ts_date DESC
  LIMIT 1
`);

const insertLogStmt = db.prepare(`
  INSERT INTO fetch_log (country_code, cadence, ts, status, notes)
  VALUES (?, ?, ?, ?, ?)
`);

export function getRegions() {
  return regions;
}

export function getAllCountries() {
  return allCountries;
}

export async function runIngest({ dateStr = todayStr(), cadence = "daily" } = {}) {
  const summaries = [];
  await Promise.all(
    allCountries.map((c) =>
      concurrency(() => ingestCountry(c, dateStr, cadence).then((s) => summaries.push(s)))
    )
  );
  return summaries;
}

async function ingestCountry(country, dateStr, cadence) {
  const start = Date.now();
  try {
    const results = await fetchTrending(country.code, dateStr);
    storeTerms(country.code, dateStr, results);
    insertLogStmt.run(country.code, cadence, new Date().toISOString(), "ok", null);
    return { country: country.code, count: results.length, ms: Date.now() - start };
  } catch (err) {
    insertLogStmt.run(country.code, cadence, new Date().toISOString(), "error", err.message);
    return { country: country.code, error: err.message };
  }
}

async function fetchTrending(countryCode, dateStr) {
  // Use Apify actor fallback because direct Trends API is blocked on many networks.
  const token = process.env.APIFY_TOKEN;
  const taskOrActor = process.env.APIFY_TASK || "petrpatek~google-trends-scraper";
  if (!token) {
    throw new Error("APIFY_TOKEN not set");
  }
  const input = {
    searchTerms: [],
    timeframe: "now 1-d",
    geo: countryCode
  };
  const url = new URL(
    `https://api.apify.com/v2/actor-tasks/${taskOrActor}/run-sync-get-dataset-items`
  );
  url.searchParams.set("token", token);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    throw new Error(`Apify fetch failed ${res.status}`);
  }
  const items = await res.json();
  if (!Array.isArray(items)) {
    throw new Error("Apify response not an array");
  }
  // Actor output shape may vary; try to map common fields.
  return items.map((item, idx) => {
    const term =
      item.title?.[0]?.query ||
      item.title ||
      item.query ||
      item.keyword ||
      item.term ||
      `item-${idx}`;
    const traffic =
      item.formattedTraffic ||
      item.traffic ||
      item.value ||
      item.score ||
      "";
    const score = parseTraffic(traffic, idx);
    const breakout = isBreakout(traffic);
    return {
      term,
      score,
      breakout_flag: breakout ? 1 : 0,
      payload_json: JSON.stringify(item)
    };
  });
}

function proxyAgent() {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
  return proxy ? new HttpsProxyAgent(proxy) : undefined;
}

function storeTerms(countryCode, dateStr, items) {
  const tx = db.transaction((rows) => {
    for (const row of rows) {
      const prevScore = prevScoreStmt.get(countryCode, row.term, dateStr)?.score;
      const change = prevScore
        ? ((row.score - prevScore) / (prevScore || 1)) * 100
        : null;
      insertTermStmt.run({
        country_code: countryCode,
        term: row.term,
        ts_date: dateStr,
        score: row.score,
        change_pct: change,
        breakout_flag: row.breakout_flag,
        payload_json: row.payload_json
      });
    }
  });
  tx(items);
}

function parseTraffic(formattedTraffic, index) {
  if (!formattedTraffic) return 100 - index;
  const lower = formattedTraffic.toLowerCase();
  if (lower.includes("breakout")) return 100000;
  const numeric = lower.replace(/[,+]/g, "").trim();
  const match = numeric.match(/^(\d+(\.\d+)?)([mk])?/);
  if (match) {
    let value = parseFloat(match[1]);
    const suffix = match[3];
    if (suffix === "m") value *= 1_000_000;
    else if (suffix === "k") value *= 1_000;
    return value;
  }
  return 100 - index; // fallback based on rank
}

function isBreakout(formattedTraffic) {
  return typeof formattedTraffic === "string" && formattedTraffic.toLowerCase().includes("breakout");
}

export function getTrendsByCountry({ country, windowDays = 30, breakoutOnly = false, limit = 20 }) {
  const since = `-${Math.max(1, windowDays)} day`;
  const params = [country, since];
  let breakoutFilter = "";
  if (breakoutOnly) breakoutFilter = "AND breakout_flag = 1";
  const stmt = db.prepare(`
    SELECT term,
      AVG(score) as score,
      MAX(breakout_flag) as breakout_flag,
      COUNT(*) as points
    FROM terms
    WHERE country_code = ?
      AND ts_date >= date('now', ?)
      ${breakoutFilter}
    GROUP BY term
    ORDER BY score DESC
    LIMIT ${limit}
  `);
  const rows = stmt.all(...params);
  return rows;
}

export function getTopByRegion({ region, windowDays = 30, limit = 30 }) {
  const since = `-${Math.max(1, windowDays)} day`;
  const stmt = db.prepare(`
    SELECT term,
      AVG(score) as score,
      MAX(breakout_flag) as breakout_flag,
      group_concat(DISTINCT country_code) as countries
    FROM terms t
    JOIN countries c ON c.code = t.country_code
    WHERE c.region = ?
      AND ts_date >= date('now', ?)
    GROUP BY term
    ORDER BY score DESC
    LIMIT ?
  `);
  return stmt.all(region, since, limit);
}

export function recentTerms({ country, limit = 7 }) {
  const stmt = db.prepare(`
    SELECT term, score, ts_date, breakout_flag
    FROM terms
    WHERE country_code = ?
    ORDER BY ts_date DESC
    LIMIT ?
  `);
  return stmt.all(country, limit);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
