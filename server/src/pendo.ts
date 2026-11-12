import type { Request } from "express";

// Server-side Pendo Track Events, sent to the Pendo Track API.
// The integration key is read from PENDO_TRACK_EVENT_SECRET and must never be
// committed. When it's unset (local dev, tests), tracking is a no-op.
const PENDO_DATA_HOST = process.env.PENDO_DATA_HOST ?? "data.pendo-dev.pendo-dev.com";
const PENDO_TRACK_EVENT_SECRET = process.env.PENDO_TRACK_EVENT_SECRET;

// The web app forwards the Pendo visitor and account IDs on each API call so
// server-side events link to the same visitor and account as the browser.
const VISITOR_HEADER = "x-pendo-visitor-id";
const ACCOUNT_HEADER = "x-pendo-account-id";

type TrackProperties = Record<string, string | number | boolean>;

export function trackPendoEvent(req: Request, event: string, properties: TrackProperties = {}): void {
  if (!PENDO_TRACK_EVENT_SECRET) return;

  const body = {
    type: "track",
    event,
    visitorId: req.get(VISITOR_HEADER) || "system",
    accountId: req.get(ACCOUNT_HEADER) || "system",
    timestamp: Date.now(),
    properties,
    context: {
      ip: req.ip,
      userAgent: req.get("user-agent"),
      url: req.originalUrl,
    },
  };

  // Fire-and-forget: a tracking failure must never break the API response.
  fetch(`https://${PENDO_DATA_HOST}/data/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pendo-integration-key": PENDO_TRACK_EVENT_SECRET,
    },
    body: JSON.stringify(body),
  })
    .then((res) => {
      if (!res.ok) console.error(`Pendo track "${event}" failed: ${res.status}`);
    })
    .catch((err: unknown) => {
      console.error(`Pendo track "${event}" failed:`, err);
    });
}
