import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { initDatabase, query, DbUser } from "./db";
import { handleApiRequest } from "./api-handler";

export const app = express();

// Security headers middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(cors());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

// Ensure database is initialized on server startup
let dbInitPromise: Promise<void> | null = null;
export function ensureDbReady(): Promise<void> {
  if (!dbInitPromise) {
    dbInitPromise = initDatabase().catch((err) => {
      console.error("[Database] Error during initDatabase:", err);
    });
  }
  return dbInitPromise;
}

// Middleware to ensure DB is initialized and route /api requests to handleApiRequest
app.use(async (req: Request, res: Response, next: NextFunction) => {
  await ensureDbReady();

  if (req.path.startsWith("/api")) {
    try {
      const protocol = req.protocol || "http";
      const host = req.get("host") || "127.0.0.1";
      const fullUrl = `${protocol}://${host}${req.originalUrl || req.url}`;

      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else if (value !== undefined) {
          headers.append(key, value);
        }
      }

      let bodyInit: string | undefined = undefined;
      if (req.method !== "GET" && req.method !== "HEAD") {
        bodyInit = typeof req.body === "object" ? JSON.stringify(req.body) : req.body;
      }

      const webReq = new globalThis.Request(fullUrl, {
        method: req.method,
        headers,
        body: bodyInit,
      });

      const webRes = await handleApiRequest(webReq);
      if (webRes) {
        res.status(webRes.status);
        webRes.headers.forEach((val, key) => {
          res.setHeader(key, val);
        });
        const text = await webRes.text();
        res.send(text);
        return;
      }
    } catch (err) {
      console.error("[Express API Adapter Error]:", err);
    }
  }

  next();
});
