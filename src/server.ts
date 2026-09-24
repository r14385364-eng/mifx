import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleApiRequest } from "./server/api-handler";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function isSocialPreviewBot(ua: string): boolean {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return (
    lower.includes("whatsapp") ||
    lower.includes("facebookexternalhit") ||
    lower.includes("facebot") ||
    lower.includes("facebookcatalog") ||
    lower.includes("meta-externalagent") ||
    lower.includes("meta-externalfetcher") ||
    lower.includes("instagram") ||
    lower.includes("telegrambot") ||
    lower.includes("twitterbot") ||
    lower.includes("xbot") ||
    lower.includes("slackbot") ||
    lower.includes("slack-imgproxy") ||
    lower.includes("linkedinbot") ||
    lower.includes("discordbot") ||
    lower.includes("pinterest") ||
    lower.includes("skypeuripreview") ||
    lower.includes("viber") ||
    lower.includes("line-poker") ||
    lower.includes("line/") ||
    lower.includes("linespider") ||
    lower.includes("kakaotalk") ||
    lower.includes("kakaostory") ||
    lower.includes("snapchat") ||
    lower.includes("tiktok") ||
    lower.includes("bytespider") ||
    lower.includes("redditbot") ||
    lower.includes("applebot") ||
    lower.includes("micromessenger") ||
    lower.includes("vkshare") ||
    lower.includes("embedly") ||
    lower.includes("iframely") ||
    lower.includes("tumblr") ||
    lower.includes("quora link preview") ||
    lower.includes("bitlybot")
  );
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const userAgent = request.headers.get("user-agent") ?? "";
      if (isSocialPreviewBot(userAgent)) {
        const url = new URL(request.url);
        // Do not intercept API requests
        if (!url.pathname.startsWith("/api/")) {
          // If the bot requests an image or icon to generate preview cards, reject with 404
          if (
            url.pathname.endsWith(".jpg") ||
            url.pathname.endsWith(".jpeg") ||
            url.pathname.endsWith(".png") ||
            url.pathname.endsWith(".webp") ||
            url.pathname.endsWith(".ico") ||
            url.pathname.endsWith(".svg")
          ) {
            return new Response(null, {
              status: 404,
              headers: {
                "cache-control": "no-store, no-cache, must-revalidate",
              },
            });
          }

          // Return a blank response with strict no-snippet/no-image metadata so WhatsApp, Telegram, Facebook, Instagram, etc. show only the raw link
          return new Response(
            '<!DOCTYPE html><html><head><meta name="robots" content="noindex, nofollow, noimageindex, nosnippet, noarchive, max-snippet:0, max-image-preview:none"><title></title></head><body></body></html>',
            {
              status: 200,
              headers: {
                "content-type": "text/html; charset=utf-8",
                "x-robots-tag":
                  "noindex, nofollow, noimageindex, nosnippet, noarchive, max-snippet:0, max-image-preview:none",
                "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
                pragma: "no-cache",
                expires: "0",
              },
            },
          );
        }
      }

      const apiResponse = await handleApiRequest(request);
      if (apiResponse) {
        return apiResponse;
      }

      const handler = await getServerEntry();
      const rawResponse = await handler.fetch(request, env, ctx);
      const response = await normalizeCatastrophicSsrResponse(rawResponse);

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) {
        const headers = new Headers(response.headers);
        headers.set(
          "x-robots-tag",
          "noimageindex, nosnippet, max-snippet:0, max-image-preview:none",
        );
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
