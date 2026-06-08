import { NextRequest } from "next/server";

export function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}
