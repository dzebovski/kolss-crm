import { NextRequest } from "next/server";

export function verifyImportWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.IMPORT_WEBHOOK_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return request.headers.get("x-import-webhook-secret") === secret;
}
