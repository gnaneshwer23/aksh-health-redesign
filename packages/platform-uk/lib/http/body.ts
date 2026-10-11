/**
 * Read a JSON body without buffering more than `maxBytes`: rejects early on Content-Length and stops reading a stream
 * once it passes the limit, so an oversized upload is refused before it is decoded or parsed.
 */
export class BodyTooLargeError extends Error {}

export async function readJsonLimited(request: Request, maxBytes: number): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? NaN);
  if (Number.isFinite(declared) && declared > maxBytes) throw new BodyTooLargeError();
  if (!request.body) return {};
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new BodyTooLargeError();
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8"));
  } catch {
    return {};
  }
}
