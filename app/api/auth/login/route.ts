import { NextResponse } from "next/server";
import { getOidcConfig, STATE_COOKIE, VERIFIER_COOKIE } from "@/lib/auth";
import { randomBytes, createHash } from "crypto";

export async function GET() {
  const config = await getOidcConfig();
  const state = randomBytes(16).toString("hex");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.OIDC_CLIENT_ID!,
    redirect_uri: process.env.OIDC_REDIRECT_URI!,
    scope: "openid profile email",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  const res = NextResponse.redirect(`${config.authorization_endpoint}?${params}`);
  const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 300, path: "/" };
  res.cookies.set(STATE_COOKIE, state, cookieOpts);
  res.cookies.set(VERIFIER_COOKIE, verifier, cookieOpts);
  return res;
}
