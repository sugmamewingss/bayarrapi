import { env } from "./env";

const XENDIT_BASE_URL = "https://api.xendit.co";

export class XenditError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Xendit API error ${status}: ${JSON.stringify(body)}`);
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
};

// Pembungkus umum untuk semua panggilan Xendit.
// Autentikasi: Basic Auth dengan secret key sebagai username dan password kosong.
export async function xenditRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const auth = Buffer.from(`${env().XENDIT_SECRET_KEY}:`).toString("base64");

  const res = await fetch(`${XENDIT_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new XenditError(res.status, data);
  return data as T;
}
