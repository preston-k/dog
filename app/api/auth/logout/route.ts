import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  const res = NextResponse.redirect(new URL("/", process.env.OIDC_REDIRECT_URI!.replace("/api/auth/callback", "")));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
