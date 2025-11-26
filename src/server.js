import fastify from "fastify";
import cors from "@fastify/cors";
import cron from "node-cron";
import dotenv from "dotenv";
import { z } from "zod";
import { initDb } from "./db.js";
import {
  getRegions,
  getAllCountries,
  getTopByRegion,
  getTrendsByCountry,
  runIngest,
  todayStr
} from "./trends.js";

dotenv.config();

const API_TOKEN = process.env.API_TOKEN;
const PORT = process.env.PORT || 4000;
const CRON_SPEC = process.env.CRON_SPEC || "0 2 * * *"; // daily at 02:00
const DISABLE_CRON = process.env.DISABLE_CRON === "true";

const app = fastify({ logger: true });

await app.register(cors, {
  origin: "*"
});

initDb();

app.addHook("preHandler", (req, reply, done) => {
  if (req.routerPath === "/health") return done();
  if (!API_TOKEN) {
    reply.code(500).send({ error: "API_TOKEN not set" });
    return;
  }
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  if (token !== API_TOKEN) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }
  done();
});

app.get("/health", async () => ({ ok: true }));

app.get("/regions", async () => {
  return { regions: getRegions(), countries: getAllCountries() };
});

app.get("/trends", async (req, reply) => {
  const schema = z.object({
    country: z.string().length(2),
    windowDays: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 30)),
    breakoutOnly: z
      .string()
      .optional()
      .transform((v) => (v === "true" ? true : v === "false" ? false : false)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 20))
  });
  const parse = schema.safeParse(req.query);
  if (!parse.success) {
    reply.code(400).send({ error: parse.error.message });
    return;
  }
  const { country, windowDays, breakoutOnly, limit } = parse.data;
  const rows = getTrendsByCountry({ country: country.toUpperCase(), windowDays, breakoutOnly, limit });
  return { country, windowDays, breakoutOnly, limit, data: rows };
});

app.get("/top", async (req, reply) => {
  const schema = z.object({
    region: z.string(),
    windowDays: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 30)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 30))
  });
  const parse = schema.safeParse(req.query);
  if (!parse.success) {
    reply.code(400).send({ error: parse.error.message });
    return;
  }
  const { region, windowDays, limit } = parse.data;
  const rows = getTopByRegion({ region, windowDays, limit });
  return { region, windowDays, limit, data: rows };
});

app.post("/ingest", async (req) => {
  const schema = z
    .object({
      date: z.string().optional(),
      cadence: z.string().optional()
    })
    .optional();
  const parsed = schema.safeParse(req.body);
  const { date, cadence } = parsed.success ? parsed.data : {};
  const dateStr = date || todayStr();
  const summaries = await runIngest({ dateStr, cadence: cadence || "manual" });
  return { ok: true, date: dateStr, summaries };
});

if (!DISABLE_CRON) {
  cron.schedule(CRON_SPEC, async () => {
    app.log.info("Running scheduled ingest...");
    try {
      await runIngest({ cadence: "scheduled" });
      app.log.info("Ingest complete");
    } catch (err) {
      app.log.error({ err }, "Scheduled ingest failed");
    }
  });
}

app.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
