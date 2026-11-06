// API base URL. Defaults to the local server; override via VITE_API_URL for
// deployed/preview environments (QAWolf runs against whatever URL this points at).
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export interface AppState {
  counter: number;
  lastAction: string;
}

// Error thrown by call() so callers (e.g. the counter_action_failed Track Event)
// can report which endpoint failed and with what HTTP status. `status` is
// undefined when the request never got a response (network/CORS failure).
export class ApiError extends Error {
  readonly endpoint: string;
  readonly status?: number;

  constructor(message: string, endpoint: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.endpoint = endpoint;
    this.status = status;
  }
}

async function call(path: string, method: "GET" | "POST"): Promise<AppState> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { method });
  } catch (e) {
    throw new ApiError((e as Error).message, path);
  }
  if (!res.ok) throw new ApiError(`${method} ${path} failed: ${res.status}`, path, res.status);
  return res.json() as Promise<AppState>;
}

export const api = {
  getState: () => call("/api/state", "GET"),
  increment: () => call("/api/increment", "POST"),
  decrement: () => call("/api/decrement", "POST"),
  reset: () => call("/api/reset", "POST"),
};
