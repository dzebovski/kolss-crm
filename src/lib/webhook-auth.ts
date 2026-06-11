import { timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyImportWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.IMPORT_WEBHOOK_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return safeEqual(auth.slice(7), secret);
  }

  const headerSecret = request.headers.get("x-import-webhook-secret");
  if (headerSecret) {
    return safeEqual(headerSecret, secret);
  }

  return false;
}
