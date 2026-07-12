import { NextResponse } from "next/server";
import { getOidcConfig, STATE_COOKIE } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function GET() {
  const config = await getOidcConfig();
  const state = randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.OIDC_CLIENT_ID!,
    redirect_uri: process.env.OIDC_REDIRECT_URI!,
    scope: "openid profile email",
    state,
  });

  const res = NextResponse.redirect(`${config.authorization_endpoint}?${params}`);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
  return res;
}
