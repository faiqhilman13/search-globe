import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { allCountries } from "./countries.js";

const baseDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
fs.mkdirSync(baseDir, { recursive: true });

const dbFile = path.join(baseDir, "trends.db");
export const db = new Database(dbFile);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS countries (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      lat REAL,
      lon REAL
    );

    CREATE TABLE IF NOT EXISTS terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      country_code TEXT NOT NULL,
      term TEXT NOT NULL,
      ts_date TEXT NOT NULL,
      score REAL,
      change_pct REAL,
      breakout_flag INTEGER DEFAULT 0,
      payload_json TEXT,
      UNIQUE(country_code, term, ts_date)
    );

    CREATE TABLE IF NOT EXISTS fetch_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      country_code TEXT NOT NULL,
      cadence TEXT NOT NULL,
      ts TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_terms_country_date ON terms (country_code, ts_date);
    CREATE INDEX IF NOT EXISTS idx_terms_term ON terms (term);
    CREATE INDEX IF NOT EXISTS idx_fetch_log_ts ON fetch_log (ts);
  `);
  seedCountries();
}

function seedCountries() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO countries (code, name, region, lat, lon)
    VALUES (@code, @name, @region, @lat, @lon)
  `);
  const tx = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });
  tx(allCountries);
}
