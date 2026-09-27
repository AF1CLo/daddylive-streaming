export const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export function htmlHeaders(referer: string): Record<string, string> {
  return {
    "User-Agent": UA,
    Referer: referer,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };
}

async function fetchOnce(url: string, referer: string): Promise<Response> {
  return fetch(url, {
    headers: htmlHeaders(referer),
    redirect: "follow",
  });
}

export async function fetchHtml(url: string, referer: string): Promise<string> {
  let lastErr = "unknown";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetchOnce(url, referer);
      if (!res.ok) {
        lastErr = `HTTP ${res.status}`;
        process.stderr.write(`FETCH ${lastErr} ${url} (try ${attempt})\n`);
        if (res.status >= 500 && attempt < 3) {
          await new Promise((r) => setTimeout(r, 800 * attempt));
          continue;
        }
        throw new Error(`fetch failed (${lastErr}): ${url}`);
      }
      return res.text();
    } catch (err) {
      const cause =
        err instanceof Error && err.cause instanceof Error
          ? err.cause.message
          : err instanceof Error
            ? err.message
            : String(err);
      lastErr = cause;
      process.stderr.write(`FETCH ERROR ${url} → ${cause} (try ${attempt})\n`);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 800 * attempt));
        continue;
      }
      throw new Error(`fetch failed: ${lastErr}`);
    }
  }
  throw new Error(`fetch failed: ${lastErr}`);
}
