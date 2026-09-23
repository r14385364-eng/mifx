import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import compression from "compression";
import { initDatabase, query, DbUser } from "./db";
import { handleApiRequest } from "./api-handler";

export const app = express();

// High performance Gzip/Brotli compression for sub-second payloads
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  }),
);

// Enhanced security headers & performance caching middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // Cache static asset requests
  if (req.path.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|woff|woff2|ttf|css|js)$/i)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }

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
